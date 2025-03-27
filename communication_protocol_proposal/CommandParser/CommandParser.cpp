/**
 * CommandParser.cpp - Library for parsing and processing serial commands for COXIRIS
 *                     Positioning System.
 * 
 * It allows for command processing with parameter validation, whitespace handling,
 * and standardized response formats.
 * 
 * Created by: Bryan Casanelli, March 2025
 */

 #include "CommandParser.h"

 /**
  * Initializes the serial communication with the specified baud rate.
  * Also sets the serial timeout for reading commands.
  */
 void CommandParser::begin() {
   Serial.begin(SERIAL_BAUD);
   Serial.setTimeout(SERIAL_TIMEOUT);
 }
 
 /**
  * Helper function to trim leading and trailing whitespace from a string.
  * 
  * @param str Pointer to the string to be trimmed
  */
 void CommandParser::trim(char* str) {
   // Null or empty string
   if (str == NULL || *str == '\0') {
     return;
   }
   // Trim leading spaces
   while (isspace(*str)) {
     memmove(str, str + 1, strlen(str)); // Shift the string to the left
   }
   // Trim trailing spaces
   int len = strlen(str);
   int i = len - 1;
   while (i >= 0 && isspace(str[i])) {
     str[i] = '\0'; // Replace trailing spaces with null terminator
     i--;
   }
 }
 
 /**
  * Helper function to convert a string to uppercase.
  * 
  * @param str Pointer to the string to be converted
  */
 void CommandParser::convertToUppercase(char* str) {
   if (str == nullptr) {
     return;
   }
   for (int i = 0; str[i] != '\0'; i++) {
     str[i] = toupper(str[i]);
   }
 }
 
 /**
  * Helper function to check if a string is a valid number.
  * Supports integers, decimals, and negative numbers.
  * 
  * @param str The string to be validated
  * @return true if the string represents a valid number, false otherwise
  */
 bool CommandParser::isValidNumber(const char* str) {
   // Check if empty string
   if(str == NULL || *str == '\0') return false;
   
   // Allow one minus or plus sign
   if(*str == '-' || *str == '+') str++;
   
   // Must have at least one digit
   bool hasDigit = false;
   bool hasDecimal = false;
   
   while(*str != '\0') {
     if(isdigit(*str)) {
       hasDigit = true;
     }
     else if(*str == '.' && !hasDecimal) {
       hasDecimal = true;
     }
     else {
       return false;
     }
     str++;
   }
   
   return hasDigit;
 }
 
 /**
  * Configure the callback functions for various commands.
  */
 void CommandParser::config(
  VoidCallback setHome,
  VoidCallback goHome,
  ThreeFloatsCallback absoluteMove,
  ThreeFloatsCallback deltaMove,
  ThreeFloatsCallback getPosition,
  FloatCallback setSpeed,
  GetFloatCallback getSpeed,
  GetFloatCallback getMinSpeed,
  GetFloatCallback getMaxSpeed,
  VoidCallback checkErrors
) {
   onSetHome = setHome;
   onGoHome = goHome;
   onAbsoluteMove = absoluteMove;
   onDeltaMove = deltaMove;
   onGetPosition = getPosition;
   onSetSpeed = setSpeed;
   onGetSpeed = getSpeed;
   onGetMinSpeed = getMinSpeed;
   onGetMaxSpeed = getMaxSpeed;
   onCheckErrors = checkErrors;
 }
 
 void CommandParser::processCommand() {
   char* token = strtok(cmdBuffer, " ");
   
   if (token != NULL) {
     // -----------------------------------------------------------------------------------------
     // HELP 
     // -----------------------------------------------------------------------------------------
     if (strcmp(token, "HELP") == 0) {
       Serial.println("ACK HELP");
       help();
       Serial.println("DONE HELP");
     }
     // -----------------------------------------------------------------------------------------
     // SET_HOME
     // -----------------------------------------------------------------------------------------
     else if (strcmp(token, "SET_HOME") == 0) {
       Serial.println("ACK SET_HOME");
       if (onSetHome != nullptr) {
         onSetHome();
       } else {
         this->reportError("SET_HOME function not configured");
       }
       Serial.println("DONE SET_HOME");
     }
     // -----------------------------------------------------------------------------------------
     // GO_HOME
     // -----------------------------------------------------------------------------------------
     else if (strcmp(token, "GO_HOME") == 0) {
       Serial.println("ACK GO_HOME");
       if (onGoHome != nullptr) {
         onGoHome();
       } else {
         this->reportError("GO_HOME function not configured");
       }
       Serial.println("DONE GO_HOME");
     }
     // -----------------------------------------------------------------------------------------
     // ABSOLUTE_MOVE
     // -----------------------------------------------------------------------------------------
     else if (strcmp(token, "ABSOLUTE_MOVE") == 0) {
       Serial.println("ACK ABSOLUTE_MOVE");
       // Split the string using space as delimiter
       char* x_str = strtok(NULL, " ");
       char* y_str = strtok(NULL, " ");
       char* z_str = strtok(NULL, " ");
       // Check if all parameters are present
       if (x_str != NULL && y_str != NULL && z_str != NULL) {
         // Check if all parameters are valid numbers
         if (isValidNumber(x_str) && isValidNumber(y_str) && isValidNumber(z_str)) {
           // Convert string to float
           float x = atof(x_str);
           float y = atof(y_str);
           float z = atof(z_str);
           
           if (onAbsoluteMove != nullptr) {
             onAbsoluteMove(x, y, z);
           } else {
             this->reportError("ABSOLUTE_MOVE function not configured");
           }
         } else {
           this->reportError("Invalid number format - Usage: ABSOLUTE_MOVE x y z (where x, y, z are numbers)");
         }
       } else {
         this->reportError("Missing parameters - Usage: ABSOLUTE_MOVE x y z");
       }
       Serial.println("DONE ABSOLUTE_MOVE");
     }
     // -----------------------------------------------------------------------------------------
     // DELTA_MOVE
     // -----------------------------------------------------------------------------------------
     else if (strcmp(token, "DELTA_MOVE") == 0) {
       Serial.println("ACK DELTA_MOVE");
       // Split the string using space as delimiter
       char* dx_str = strtok(NULL, " ");
       char* dy_str = strtok(NULL, " ");
       char* dz_str = strtok(NULL, " ");
       // Check if all parameters are present
       if (dx_str != NULL && dy_str != NULL && dz_str != NULL) {
         // Check if all parameters are valid numbers
         if (isValidNumber(dx_str) && isValidNumber(dy_str) && isValidNumber(dz_str)) {
           // Convert string to float
           float dx = atof(dx_str);
           float dy = atof(dy_str);
           float dz = atof(dz_str);
           
           if (onDeltaMove != nullptr) {
             onDeltaMove(dx, dy, dz);
           } else {
             this->reportError("DELTA_MOVE function not configured");
           }
         } else {
           this->reportError("Invalid number format - Usage: DELTA_MOVE dx dy dz (where dx, dy, dz are numbers)");
         }
       } else {
         this->reportError("Missing parameters - Usage: DELTA_MOVE dx dy dz");
       }
       Serial.println("DONE DELTA_MOVE");
     }
     // -----------------------------------------------------------------------------------------
     // GET_POSITION
     // -----------------------------------------------------------------------------------------
     else if (strcmp(token, "GET_POSITION") == 0) {
       Serial.println("ACK GET_POSITION");
       
       if (onGetPosition != nullptr) {
         float x = 0, y = 0, z = 0;
         onGetPosition(x, y, z);
         
         Serial.print("DONE GET_POSITION: ");
         Serial.print(x, 2); Serial.print(" ");
         Serial.print(y, 2); Serial.print(" ");
         Serial.println(z, 2);
       } else {
         this->reportError("GET_POSITION function not configured");
         Serial.print("DONE GET_POSITION: ");
         Serial.print("0.00 "); 
         Serial.print("0.00 "); 
         Serial.println("0.00");
       }
     }
     // -----------------------------------------------------------------------------------------
     // SET_SPEED
     // -----------------------------------------------------------------------------------------
     else if (strcmp(token, "SET_SPEED") == 0) {
       Serial.println("ACK SET_SPEED");
       // Get the next token (speed value)
       char* speed_str = strtok(NULL, " ");
       // Check if the speed parameter is present
       if (speed_str != NULL) {
         // Check if the speed parameter is a valid number
         if (isValidNumber(speed_str)) {
           // Convert string to float
           float speed = atof(speed_str);
           // Speed should be positive
           if (speed > 0) {
             if (onSetSpeed != nullptr) {
               onSetSpeed(speed);
             } else {
               this->reportError("SET_SPEED function not configured");
             }
           } else {
             this->reportError("Speed must be positive - Usage: SET_SPEED speed (where speed > 0)");
           }
         } else {
           this->reportError("Invalid number format - Usage: SET_SPEED speed (where speed is a number)");
         }
       } else {
         this->reportError("Missing parameter - Usage: SET_SPEED speed");
       }
       Serial.println("DONE SET_SPEED");
     }
     // -----------------------------------------------------------------------------------------
     // GET_SPEED
     // -----------------------------------------------------------------------------------------
     else if (strcmp(token, "GET_SPEED") == 0) {
       Serial.println("ACK GET_SPEED");
       
       if (onGetSpeed != nullptr) {
          float speed = 0;
         onGetSpeed(speed);
         Serial.print("DONE GET_SPEED: ");
         Serial.println(speed, 0);
       } else {
         this->reportError("GET_SPEED function not configured");
         Serial.print("DONE GET_SPEED: ");
         Serial.println("0");
       }
     }
     // -----------------------------------------------------------------------------------------
     // GET_MIN_SPEED
     // -----------------------------------------------------------------------------------------
     else if (strcmp(token, "GET_MIN_SPEED") == 0) {
       Serial.println("ACK GET_MIN_SPEED");
       
       if (onGetMinSpeed != nullptr) {
         float minSpeed = 0;
         onGetMinSpeed();
         Serial.print("DONE GET_MIN_SPEED: ");
         Serial.println(minSpeed, 0);
       } else {
         this->reportError("GET_MIN_SPEED function not configured");
         Serial.print("DONE GET_MIN_SPEED: ");
         Serial.println("0");
       }
     }
     // -----------------------------------------------------------------------------------------
     // GET_MAX_SPEED
     // -----------------------------------------------------------------------------------------
     else if (strcmp(token, "GET_MAX_SPEED") == 0) {
       Serial.println("ACK GET_MAX_SPEED");
       
       if (onGetMaxSpeed != nullptr) {
         float maxSpeed = 0;
         onGetMaxSpeed();
         Serial.print("DONE GET_MAX_SPEED: ");
         Serial.println(maxSpeed, 0);
       } else {
         this->reportError("GET_MAX_SPEED function not configured");
         Serial.print("DONE GET_MAX_SPEED: ");
         Serial.println("0");
       }
     }
     // -----------------------------------------------------------------------------------------
     // GET_ID
     // -----------------------------------------------------------------------------------------
     else if (strcmp(token, "GET_ID") == 0) {
       Serial.println("ACK GET_ID");
       Serial.print("DONE GET_ID: ");
       Serial.println(DEVICE_ID);
     }
     // -----------------------------------------------------------------------------------------
     // CHECK_ERRORS
     // -----------------------------------------------------------------------------------------
     else if (strcmp(token, "CHECK_ERRORS") == 0) {
       Serial.println("ACK CHECK_ERRORS");
       
       if (onCheckErrors != nullptr) {
         onCheckErrors();
       } else {
        this->reportError("CHECK_ERRORS function not configured");
       }
       
       Serial.println("DONE CHECK_ERRORS");
     }
     // -----------------------------------------------------------------------------------------
     // Unknown command
     // -----------------------------------------------------------------------------------------
     else {
       this->reportError("Unknown command - ");
       Serial.println(cmdBuffer);
       help();
     }
   }
 }
 
 /**
  * Displays a help message with all available commands and their usage.
  * This function prints all supported commands to the serial port.
  */
 void CommandParser::help() {
   Serial.println("Available commands:");
   Serial.println("HELP - Displays this help message");
   Serial.println("SET_HOME - Sets current position as home (0,0,0)");
   Serial.println("GO_HOME - Moves to home position (0,0,0)");
   Serial.println("ABSOLUTE_MOVE x y z - Moves to absolute position x, y, z");
   Serial.println("DELTA_MOVE dx dy dz - Moves relative to current position by dx, dy, dz");
   Serial.println("GET_POSITION - Returns current position");
   Serial.println("SET_SPEED speed - Sets movement speed to speed in mm/s");
   Serial.println("GET_SPEED - Returns current movement speed in mm/s");
   Serial.println("GET_MIN_SPEED - Returns minimum allowed movement speed in mm/s");
   Serial.println("GET_MAX_SPEED - Returns maximum allowed movement speed in mm/s");
   Serial.println("GET_ID - Returns the unique device identifier");
   Serial.println("CHECK_ERRORS - Performs system diagnostics and reports any errors");
 }
 
 /**
  * Reads and processes incoming serial commands.
  * This function should be called repeatedly in the main loop.
  * It handles command termination, buffer overflow, and parses complete commands.
  */
 void CommandParser::read() {
   // Process all available bytes in the serial buffer
   while (Serial.available() > 0) {
     // Read a single character from the serial buffer
     char c = Serial.read();
     
     // Check if we've reached the end of a command (newline or carriage return)
     if (c == '\n' || c == '\r') {
       if (cmdIndex > 0) {  // Only process if we have content (ignore empty lines)
         cmdBuffer[cmdIndex] = '\0';  // Null-terminate the string
         trim(cmdBuffer);   // Trim leading and trailing whitespace
         convertToUppercase(cmdBuffer);  // Convert to uppercase
         processCommand();  // Process the complete command
         cmdIndex = 0;      // Reset the buffer index for the next command
       }
     } 
     // If there's still room in the buffer, store the character
     else if (cmdIndex < BUFFER_SIZE - 1) {
       cmdBuffer[cmdIndex++] = c;  // Store the character and increment the index
     }
     // Handle buffer overflow (command too long)
     else {
       cmdIndex = 0;  // Reset the buffer index
       this->reportError("Command too long");
       
       // Consume the rest of the command until end of line to avoid
       // treating the remainder as a new command
       while (Serial.available() > 0) {
         char discard = Serial.read();
         if (discard == '\n' || discard == '\r') break;
       }
     }
   }
 }