/**
 * CommandParser.h - Library for parsing and processing serial commands for COXIRIS
 *                   Positioning System.
 * 
 * It allows for command processing with parameter validation, whitespace handling,
 * and standardized response formats.
 * 
 * Created by: Bryan Casanelli, March 2025
 */

 #ifndef COMMAND_PARSER_H
 #define COMMAND_PARSER_H
 
 #include <Arduino.h>
 #include <ctype.h>
 #include <string.h>
 
 #define BUFFER_SIZE 64      // Maximum command length
 #define SERIAL_TIMEOUT 50   // Serial read timeout in milliseconds
 #define SERIAL_BAUD 115200  // Default serial baud rate
 #define DEVICE_ID "CX25F7TK9P"  // Fixed unique device identifier (10 characters)
 
 /**
  * CommandParser class - Handles serial command processing
  * 
  * This class provides methods for receiving, validating, and executing
  * commands received over serial communication.
  */
 class CommandParser {
   public:
     // Function pointer types for callbacks
     typedef void (*VoidCallback)();
     typedef void (*ThreeFloatsCallback)(float &a, float &b, float &c);
     typedef void (*FloatCallback)(float &value);
 
     
   private:
     // General variables
     char cmdBuffer[BUFFER_SIZE];  // Buffer to store incoming command
     int cmdIndex = 0;             // Index to keep track of buffer position
     
     // Callback function pointers
     VoidCallback onSetHome = nullptr;
     VoidCallback onGoHome = nullptr;
     ThreeFloatsCallback onAbsoluteMove = nullptr;
     ThreeFloatsCallback onDeltaMove = nullptr;
     ThreeFloatsCallback onGetPosition = nullptr;
     FloatCallback onSetSpeed = nullptr;
     FloatCallback onGetSpeed = nullptr;
     FloatCallback onGetMinSpeed = nullptr;
     FloatCallback onGetMaxSpeed = nullptr;
     VoidCallback onCheckErrors = nullptr;
     
     // Error reporter function
     void reportError(const char* errorMessage) {
       Serial.print("ERROR: ");
       Serial.println(errorMessage);
     }
     
     /**
      * Helper function to trim leading and trailing whitespace
      * 
      * @param str Pointer to the string to be trimmed
      */
     void trim(char* str);
     
     /**
      * Helper function to convert a string to uppercase
      * 
      * @param str Pointer to the string to be converted
      */
     void convertToUppercase(char* str);
     
     /**
      * Helper function to check if a string is a valid number
      * 
      * @param str The string to be validated
      * @return true if the string represents a valid number, false otherwise
      */
     bool isValidNumber(const char* str);
     
     /**
      * Helper function to process the received command
      * Parses the command and executes the appropriate action
      */
     void processCommand();
 
   public:
     /**
      * Initializes the serial communication with the specified baud rate.
      * Also sets the serial timeout for reading commands.
      */
     void begin();
     
     /**
      * Configures the callback functions for various commands.
      * 
      * @param setHome Function to call when SET_HOME command is received
      * @param goHome Function to call when GO_HOME command is received
      * @param absoluteMove Function to call when ABSOLUTE_MOVE command is received
      * @param deltaMove Function to call when DELTA_MOVE command is received
      * @param getPosition Function to call when GET_POSITION command is received
      * @param setSpeed Function to call when SET_SPEED command is received
      * @param getSpeed Function to call when GET_SPEED command is received
      * @param getMinSpeed Function to call when GET_MIN_SPEED command is received
      * @param getMaxSpeed Function to call when GET_MAX_SPEED command is received
      * @param checkErrors Function to call when CHECK_ERRORS command is received
      */
     void config(
      VoidCallback setHome = nullptr,
      VoidCallback goHome = nullptr,
      ThreeFloatsCallback absoluteMove = nullptr,
      ThreeFloatsCallback deltaMove = nullptr,
      ThreeFloatsCallback getPosition = nullptr,
      FloatCallback setSpeed = nullptr,
      FloatCallback getSpeed = nullptr,
      FloatCallback getMinSpeed = nullptr,
      FloatCallback getMaxSpeed = nullptr,
      VoidCallback checkErrors = nullptr
    );
     
     /**
      * Displays a help message with available commands.
      * This function prints all supported commands to the serial port.
      */
     void help();
     
     /**
      * Reads and processes incoming serial commands.
      * This function should be called repeatedly in the main loop.
      */
     void read();
 };
 
 #endif