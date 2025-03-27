<script>
  import { _ } from 'svelte-i18n';
  
  // States for different values and configurations
  let position = { x: 0, y: 0, z: 0 };
  let speed = 1000;
  let ports = [];
  let selectedPort = '';
  let isConnected = false;
  let logs = [];
  let absoluteMove = { x: 0, y: 0, z: 0 };
  let deltaMove = { x: 0, y: 0, z: 0 };

  // Initialize available ports
  function initPorts() {
    // In a real application, this would come from your Electron API
    ports = ['COM1', 'COM2', 'COM3', '/dev/ttyUSB0', '/dev/ttyUSB1'];
  }

  // Function to add messages to the log
  function addLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    logs = [...logs, `[${timestamp}] ${message}`];
  }

  // Event handlers
  function handleConnect() {
    if (!selectedPort) {
      addLog($_('error.no_port_selected'));
      return;
    }
    
    isConnected = true;
    addLog($_('log.connected_to_port', { values: { port: selectedPort } }));
  }

  function handleDisconnect() {
    isConnected = false;
    addLog($_('log.disconnected'));
  }

  function handleSetHome() {
    position = { x: 0, y: 0, z: 0 };
    addLog($_('log.position_set_as_home'));
  }

  function handleGoHome() {
    addLog($_('log.moving_to_home'));
    position = { x: 0, y: 0, z: 0 };
  }

  function handleSetSpeed(e) {
    e.preventDefault();
    addLog($_('log.speed_set', { values: { speed } }));
  }

  function handleAbsoluteMove(e) {
    e.preventDefault();
    position = absoluteMove;
    addLog($_('log.absolute_move', { values: { x: absoluteMove.x, y: absoluteMove.y, z: absoluteMove.z } }));
  }

  function handleDeltaMove(e) {
    e.preventDefault();
    const newPosition = {
      x: position.x + Number(deltaMove.x),
      y: position.y + Number(deltaMove.y),
      z: position.z + Number(deltaMove.z)
    };
    position = newPosition;
    addLog($_('log.delta_move', { 
      values: { 
        dx: deltaMove.x, 
        dy: deltaMove.y, 
        dz: deltaMove.z, 
        x: newPosition.x, 
        y: newPosition.y, 
        z: newPosition.z 
      } 
    }));
  }
  
  // Initialize on component mount
  initPorts();
</script>

<div class="flex flex-col md:flex-row max-w-8xl mx-auto p-4 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 min-h-screen gap-4">
  <!-- Left Column: All controls -->
  <div class="flex flex-col md:w-3/4 space-y-6">
    <h1 class="text-2xl font-bold text-center mb-6 text-neutral-700 dark:text-neutral-300">
      {$_('positioning.title')}
    </h1>
    
    <!-- Top Row: Status and Connection -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- System Status -->
      <div class="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-md shadow">
        <h2 class="text-lg font-semibold mb-4 text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-700 p-2 rounded-md">
          {$_('positioning.system_status')}
        </h2>
        <div class="grid grid-cols-2 gap-y-2">
          <div class="text-neutral-700 dark:text-neutral-300">{$_('positioning.position_x')}:</div>
          <div class="text-right">{position.x} mm</div>
          <div class="text-neutral-700 dark:text-neutral-300">{$_('positioning.position_y')}:</div>
          <div class="text-right">{position.y} mm</div>
          <div class="text-neutral-700 dark:text-neutral-300">{$_('positioning.position_z')}:</div>
          <div class="text-right">{position.z} mm</div>
          <div class="text-neutral-700 dark:text-neutral-300">{$_('positioning.speed')}:</div>
          <div class="text-right">{speed} mm/min</div>
          <div class="text-neutral-700 dark:text-neutral-300">{$_('positioning.status')}:</div>
          <div class="text-right">
            {#if isConnected}
              <span class="text-green-600 dark:text-green-400">{$_('positioning.connected')}</span>
            {:else}
              <span class="text-red-600 dark:text-red-400">{$_('positioning.disconnected')}</span>
            {/if}
          </div>
        </div>
      </div>
      
      <!-- Connection -->
      <div class="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-md shadow">
        <h2 class="text-lg font-semibold mb-4 text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-700 p-2 rounded-md">
          {$_('positioning.connection')}
        </h2>
        <div class="flex flex-col h-32">
          <div class="mb-4">
            <label class="block text-neutral-700 dark:text-neutral-300 mb-2">{$_('positioning.port')}:</label>
            <select 
              class="w-full p-2 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-400"
              bind:value={selectedPort}
              disabled={isConnected}
            >
              <option value="">{$_('positioning.select_port')}</option>
              {#each ports as port}
                <option value={port}>{port}</option>
              {/each}
            </select>
          </div>
          <div class="flex justify-center items-center space-x-4 flex-grow">
            <button 
              class="bg-blue-500 dark:bg-blue-600 text-white py-2 px-6 rounded-md font-medium hover:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 disabled:text-neutral-500 dark:disabled:text-neutral-600 transition cursor-pointer"
              on:click={handleConnect}
              disabled={isConnected || !selectedPort}
            >
              {$_('positioning.connect')}
            </button>
            <button 
              class="bg-red-500 dark:bg-red-600 text-white py-2 px-6 rounded-md font-medium hover:bg-red-600 dark:hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 disabled:text-neutral-500 dark:disabled:text-neutral-600 transition cursor-pointer"
              on:click={handleDisconnect}
              disabled={!isConnected}
            >
              {$_('positioning.disconnect')}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Middle Row: Basic Control -->
    <div class="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-md shadow">
      <h2 class="text-lg font-semibold mb-4 text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-700 p-2 rounded-md">
        {$_('positioning.basic_control')}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Home Controls -->
        <div class="flex flex-col space-y-4">
          <div class="flex space-x-4 justify-center">
            <button 
              class="bg-blue-500 dark:bg-blue-600 text-white py-2 px-6 rounded-md font-medium hover:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 disabled:text-neutral-500 dark:disabled:text-neutral-600 transition cursor-pointer"
              on:click={handleSetHome}
              disabled={!isConnected}
            >
              {$_('positioning.set_home')}
            </button>
            <button 
              class="bg-blue-500 dark:bg-blue-600 text-white py-2 px-6 rounded-md font-medium hover:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 disabled:text-neutral-500 dark:disabled:text-neutral-600 transition cursor-pointer"
              on:click={handleGoHome}
              disabled={!isConnected}
            >
              {$_('positioning.go_home')}
            </button>
          </div>
        </div>
        
        <!-- Speed Control -->
        <div class="flex items-center space-x-2">
          <label class="text-neutral-700 dark:text-neutral-300 whitespace-nowrap">{$_('positioning.speed')}:</label>
          <input 
            type="number" 
            class="flex-1 p-2 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-400"
            bind:value={speed}
            min="1"
          />
          <button 
            class="bg-blue-500 dark:bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 disabled:text-neutral-500 dark:disabled:text-neutral-600 transition cursor-pointer whitespace-nowrap"
            on:click={handleSetSpeed}
            disabled={!isConnected}
          >
            {$_('positioning.set_speed')}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Movement Controls with Absolute and Relative side by side -->
    <div class="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-md shadow">
      <h2 class="text-lg font-semibold mb-4 text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-700 p-2 rounded-md">
        {$_('positioning.movement')}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Absolute Movement -->
        <div class="bg-neutral-200 dark:bg-neutral-700 p-3 rounded-md">
          <h3 class="text-md font-semibold mb-3 text-neutral-700 dark:text-neutral-300 bg-neutral-300 dark:bg-neutral-600 p-2 rounded-md">
            {$_('positioning.absolute_movement')}
          </h3>
          <div class="flex flex-col space-y-4">
            <div class="grid grid-cols-3 gap-2">
              <input 
                type="number"
                placeholder="X"
                class="p-2 rounded-md bg-neutral-300 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-200 border-neutral-400 dark:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500 dark:focus:ring-neutral-400"
                bind:value={absoluteMove.x}
              />
              <input 
                type="number"
                placeholder="Y"
                class="p-2 rounded-md bg-neutral-300 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-200 border-neutral-400 dark:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500 dark:focus:ring-neutral-400"
                bind:value={absoluteMove.y}
              />
              <input 
                type="number"
                placeholder="Z"
                class="p-2 rounded-md bg-neutral-300 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-200 border-neutral-400 dark:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500 dark:focus:ring-neutral-400"
                bind:value={absoluteMove.z}
              />
            </div>
            <button 
              class="bg-blue-500 dark:bg-blue-600 text-white py-2 px-6 rounded-md font-medium hover:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 disabled:text-neutral-500 dark:disabled:text-neutral-600 transition cursor-pointer w-full"
              on:click={handleAbsoluteMove}
              disabled={!isConnected}
            >
              {$_('positioning.go_to_position')}
            </button>
          </div>
        </div>
        
        <!-- Relative Movement -->
        <div class="bg-neutral-200 dark:bg-neutral-700 p-3 rounded-md">
          <h3 class="text-md font-semibold mb-3 text-neutral-700 dark:text-neutral-300 bg-neutral-300 dark:bg-neutral-600 p-2 rounded-md">
            {$_('positioning.relative_movement')}
          </h3>
          <div class="flex flex-col space-y-4">
            <div class="grid grid-cols-3 gap-2">
              <input 
                type="number"
                placeholder="ΔX"
                class="p-2 rounded-md bg-neutral-300 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-200 border-neutral-400 dark:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500 dark:focus:ring-neutral-400"
                bind:value={deltaMove.x}
              />
              <input 
                type="number"
                placeholder="ΔY"
                class="p-2 rounded-md bg-neutral-300 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-200 border-neutral-400 dark:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500 dark:focus:ring-neutral-400"
                bind:value={deltaMove.y}
              />
              <input 
                type="number"
                placeholder="ΔZ"
                class="p-2 rounded-md bg-neutral-300 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-200 border-neutral-400 dark:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-500 dark:focus:ring-neutral-400"
                bind:value={deltaMove.z}
              />
            </div>
            <button 
              class="bg-blue-500 dark:bg-blue-600 text-white py-2 px-6 rounded-md font-medium hover:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 disabled:text-neutral-500 dark:disabled:text-neutral-600 transition cursor-pointer w-full"
              on:click={handleDeltaMove}
              disabled={!isConnected}
            >
              {$_('positioning.move')}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Right Column: Terminal -->
  <div class="md:w-1/4 mt-6 md:mt-0 flex flex-col">
    <div class="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-md shadow h-full flex flex-col">
      <h2 class="text-lg font-semibold mb-4 text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-700 p-2 rounded-md">
        {$_('positioning.terminal')}
      </h2>
      <div class="bg-white dark:bg-neutral-900 text-green-700 dark:text-green-400 p-3 rounded-md flex-grow overflow-y-auto font-mono text-sm border border-neutral-300 dark:border-neutral-700">
        {#if logs.length > 0}
          {#each logs as log}
            <div>{log}</div>
          {/each}
        {:else}
          <div class="text-neutral-400 dark:text-neutral-500">{$_('positioning.no_activity')}</div>
        {/if}
      </div>
    </div>
  </div>
</div>