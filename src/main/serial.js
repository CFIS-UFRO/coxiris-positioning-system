/**
 * Serial G-code Library for COXIRIS Positioning System
 * 
 * This library provides a simple interface to communicate
 * over the Serial port using G-code commands.
 * 
 * Includes direct Electron IPC integration with simplified event handling.
 */

import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import log from 'electron-log';
import { ipcMain, BrowserWindow } from 'electron';

class SerialGCodePrinter {
  constructor() {
    this.port = null;
    this.parser = null;
    this.currentSpeed = 0;
    this.isConnected = false;
    this.moveCompleteCallbacks = [];
    this.errorCallbacks = [];
    this.currentCommand = null;
    this.timeoutId = null;
    this.mainWindow = null;
  }

  /**
   * Initializes IPC handlers for the main process
   * Call this method after creating a new instance
   * @param {BrowserWindow} mainWindow - The main Electron browser window
   */
  initializeIPC(mainWindow) {
    this.mainWindow = mainWindow;
    
    // Set up event handlers for renderer requests
    ipcMain.handle('list-ports', async () => {
      return await this.listPorts();
    });
    
    ipcMain.handle('connect-printer', async (event, portPath, options) => {
      return await this.connect(portPath, options);
    });
    
    ipcMain.handle('disconnect-printer', async () => {
      return await this.disconnect();
    });
    
    ipcMain.handle('set-home', async (event, axes) => {
      return await this.setHome(axes);
    });
    
    ipcMain.handle('go-home', async () => {
      return await this.goHome();
    });
    
    ipcMain.handle('set-speed', async (event, speed) => {
      return await this.setSpeed(speed);
    });
    
    ipcMain.handle('get-speed', () => {
      return this.getSpeed();
    });
    
    ipcMain.handle('absolute-move', async (event, position, rapid) => {
      return await this.absoluteMove(position, rapid);
    });
    
    ipcMain.handle('delta-move', async (event, distance, rapid) => {
      return await this.deltaMove(distance, rapid);
    });
    
    ipcMain.handle('send-command', async (event, command, timeout) => {
      return await this.sendCommand(command, timeout);
    });
    
    log.info('SerialGCodePrinter IPC initialized');
  }
  
  /**
   * Sends an error event to the renderer process
   * @param {string} message - Error message
   * @private
   */
  sendErrorToRenderer(message) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('printer-error', message);
    }
  }

  /**
   * Lists all available serial ports
   * @returns {Promise<Array<Object>>} List of available ports
   */
  async listPorts() {
    try {
      const ports = await SerialPort.list();
      log.info('Available ports:', ports);
      return ports;
    } catch (error) {
      log.error('Error listing serial ports:', error);
      this.sendErrorToRenderer(`Error listing ports: ${error.message}`);
      throw error;
    }
  }

  /**
   * Opens a connection to the specified serial port
   * @param {string} portPath - The path to the serial port (e.g., 'COM3', '/dev/ttyUSB0')
   * @param {Object} options - Serial connection options
   * @returns {Promise<boolean>}
   */
  async connect(portPath, options = { 
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1,
    parity: 'none'
  }) {
    return new Promise((resolve, reject) => {
      try {
        // Create the serial port
        this.port = new SerialPort({
          path: portPath,
          ...options,
          autoOpen: false
        });

        // Set up the parser
        this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));
        
        // Set up event handlers
        this.port.on('open', () => {
          log.info('Connected to printer on port:', portPath);
          this.isConnected = true;
          
          // Set up response handling
          this.parser.on('data', (line) => {
            this.processResponse(line.toString().trim());
          });

          // Initialize the printer (wait for startup)
          setTimeout(async () => {
            // Send initial commands
            await this.sendCommand('M115'); // Get firmware info
            resolve(true);
          }, 2000);
        });

        this.port.on('error', (error) => {
          log.error('Serial port error:', error);
          this.isConnected = false;
          this.sendErrorToRenderer(`Serial port error: ${error.message}`);
          reject(error);
        });

        // Open the port
        this.port.open();
      } catch (error) {
        log.error('Error connecting to serial port:', error);
        this.isConnected = false;
        this.sendErrorToRenderer(`Connection error: ${error.message}`);
        reject(error);
      }
    });
  }

  /**
   * Process responses from the printer
   * @param {string} line - A line received from the printer
   * @private
   */
  processResponse(line) {
    log.info('Received:', line);
    
    // Check for "ok" message (movement complete)
    if (line === 'ok') {
      log.info('Movement completed');
      
      // Clear timeout if it exists
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      
      this.currentCommand = null;
      
      // Trigger callbacks
      if (this.moveCompleteCallbacks.length > 0) {
        this.moveCompleteCallbacks.forEach(callback => callback());
        this.moveCompleteCallbacks = [];
      }
    }
    
    // Check for error messages
    if (line.startsWith('Error:')) {
      const errorMessage = line.substring(6).trim();
      log.error('Printer error:', errorMessage);
      
      // Clear timeout if it exists
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      
      // Send error to renderer
      this.sendErrorToRenderer(errorMessage);
      
      // Reset current command
      this.currentCommand = null;
      
      // Trigger error callbacks
      if (this.errorCallbacks.length > 0) {
        this.errorCallbacks.forEach(callback => callback(errorMessage));
      }
    }
  }

  /**
   * Sends a command to the printer
   * @param {string} command - The G-code command to send
   * @param {number} timeout - Timeout in milliseconds (default 30000)
   * @returns {Promise<void>}
   */
  async sendCommand(command, timeout = 30000) {
    if (!this.isConnected || !this.port) {
      const error = new Error('Not connected to printer');
      this.sendErrorToRenderer(error.message);
      throw error;
    }
    
    this.currentCommand = command;
    
    return new Promise((resolve, reject) => {
      this.port.write(command + '\n', (err) => {
        if (err) {
          log.error('Error sending command:', err);
          this.currentCommand = null;
          this.sendErrorToRenderer(`Failed to send command: ${err.message}`);
          reject(err);
        } else {
          log.info('Sent:', command);
          
          // For commands that don't expect an "ok" response
          // resolve immediately without waiting
          if (command === 'M115' || command.startsWith('M114')) {
            resolve();
          } else {
            // For movement commands and others, wait for "ok"
            this.onMoveComplete(resolve);
            
            // Set a timeout to prevent infinite waiting
            this.timeoutId = setTimeout(() => {
              // Only reject if this specific command is still pending
              if (this.currentCommand === command) {
                this.moveCompleteCallbacks = this.moveCompleteCallbacks.filter(cb => cb !== resolve);
                this.currentCommand = null;
                const timeoutError = new Error(`Command "${command}" timed out after ${timeout}ms`);
                this.sendErrorToRenderer(timeoutError.message);
                reject(timeoutError);
              }
            }, timeout);
          }
        }
      });
    });
  }

  /**
   * Registers a callback for when a movement is complete
   * @param {Function} callback - Function to call when movement completes
   */
  onMoveComplete(callback) {
    this.moveCompleteCallbacks.push(callback);
  }

  /**
   * Registers a callback for when an error occurs
   * @param {Function} callback - Function to call when an error occurs
   */
  onError(callback) {
    this.errorCallbacks.push(callback);
  }

  /**
   * Closes the connection to the printer
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (!this.isConnected) {
      return Promise.resolve();
    }
    
    // Clear any pending timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    return new Promise((resolve, reject) => {
      this.port.close((err) => {
        if (err) {
          log.error('Error disconnecting from printer:', err);
          this.sendErrorToRenderer(`Disconnection error: ${err.message}`);
          reject(err);
        } else {
          this.isConnected = false;
          this.port = null;
          log.info('Disconnected from printer');
          resolve();
        }
      });
    });
  }

  /**
   * Sets the home position (G28)
   * @param {Object} axes - Which axes to home (x, y, z)
   * @returns {Promise<void>}
   */
  async setHome(axes = { x: true, y: true, z: true }) {
    let command = 'G28';
    
    if (axes.x || axes.y || axes.z) {
      if (axes.x) command += ' X0';
      if (axes.y) command += ' Y0';
      if (axes.z) command += ' Z0';
    }
    
    log.info('Setting home position');
    return this.sendCommand(command);
  }

  /**
   * Goes to the home position (G28)
   * @returns {Promise<void>}
   */
  async goHome() {
    log.info('Going to home position');
    return this.sendCommand('G28');
  }

  /**
   * Sets the movement speed (F parameter)
   * @param {number} speed - The speed in mm/min
   * @returns {Promise<void>}
   */
  async setSpeed(speed) {
    log.info(`Setting speed to ${speed} mm/min`);
    this.currentSpeed = speed;
    // Note: Speed is actually set in the move commands with F parameter
    // This just stores the value for future move commands
    return Promise.resolve();
  }

  /**
   * Gets the current movement speed
   * @returns {number} The current speed in mm/min
   */
  getSpeed() {
    return this.currentSpeed;
  }

  /**
   * Performs an absolute move (G0/G1)
   * @param {Object} position - The position to move to {x, y, z}
   * @param {boolean} rapid - Whether to use rapid movement (G0) or controlled movement (G1)
   * @returns {Promise<void>}
   */
  async absoluteMove(position, rapid = false) {
    const gcode = rapid ? 'G0' : 'G1';
    let command = gcode;
    
    if (position.x !== undefined) command += ` X${position.x}`;
    if (position.y !== undefined) command += ` Y${position.y}`;
    if (position.z !== undefined) command += ` Z${position.z}`;
    
    // Add speed parameter if set
    if (this.currentSpeed > 0) {
      command += ` F${this.currentSpeed}`;
    }
    
    log.info(`Performing absolute move to: ${JSON.stringify(position)}`);
    return this.sendCommand(command);
  }

  /**
   * Performs a relative move (G0/G1 with G91 mode)
   * @param {Object} distance - The distance to move {x, y, z}
   * @param {boolean} rapid - Whether to use rapid movement (G0) or controlled movement (G1)
   * @returns {Promise<void>}
   */
  async deltaMove(distance, rapid = false) {
    log.info(`Performing relative move: ${JSON.stringify(distance)}`);
    
    try {
      // Set to relative positioning mode
      await this.sendCommand('G91');
      
      const gcode = rapid ? 'G0' : 'G1';
      let command = gcode;
      
      if (distance.x !== undefined) command += ` X${distance.x}`;
      if (distance.y !== undefined) command += ` Y${distance.y}`;
      if (distance.z !== undefined) command += ` Z${distance.z}`;
      
      // Add speed parameter if set
      if (this.currentSpeed > 0) {
        command += ` F${this.currentSpeed}`;
      }
      
      await this.sendCommand(command);
      
      // Set back to absolute positioning mode (typical default)
      return this.sendCommand('G90');
    } catch (error) {
      // Make sure we try to restore absolute mode even if there was an error
      try {
        await this.sendCommand('G90');
      } catch (restoreError) {
        log.error('Failed to restore absolute positioning after error:', restoreError);
      }
      throw error;
    }
  }
  
  /**
   * Cleanup and remove all IPC handlers
   * Call this before application exit
   */
  cleanup() {
    // Remove all IPC handlers
    ipcMain.removeHandler('list-ports');
    ipcMain.removeHandler('connect-printer');
    ipcMain.removeHandler('disconnect-printer');
    ipcMain.removeHandler('set-home');
    ipcMain.removeHandler('go-home');
    ipcMain.removeHandler('set-speed');
    ipcMain.removeHandler('get-speed');
    ipcMain.removeHandler('absolute-move');
    ipcMain.removeHandler('delta-move');
    ipcMain.removeHandler('send-command');
    
    // Disconnect if still connected
    if (this.isConnected) {
      this.disconnect().catch(err => {
        log.error('Error disconnecting during cleanup:', err);
      });
    }
    
    log.info('SerialGCodePrinter IPC cleaned up');
  }
}

export default SerialGCodePrinter;