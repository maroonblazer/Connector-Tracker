function handleError(error, message) {
  console.error(message, error);
  // Optionally, display a message to the user, if appropriate
  // alert("An error occurred: " + message);
}

// Utility function to open a connection to the IndexedDB
function openDatabase() {
  const request = indexedDB.open('timestampDB', 1);

  request.onupgradeneeded = function (e) {
    const db = e.target.result;
    db.createObjectStore('timestamps', { keyPath: 'id', autoIncrement: true });
  };

  return new Promise((resolve, reject) => {
    request.onerror = function () {
      reject(request.error);
    };
    request.onsuccess = function () {
      resolve(request.result);
    };
  });
}

async function getStore(storeName, mode) {
  const db = await openDatabase();
  return db.transaction(storeName, mode).objectStore(storeName);
}

// Function to add a timestamp to the database
async function addTimestamp(timestamp, scheduledTime) {
  try {
    const store = await getStore('timestamps', 'readwrite');
    await store.add({ timestamp, scheduledTime });
  } catch (error) {
    handleError(error, 'Failed to add timestamp');
  }
}

// Function to get all timestamps from the database
async function getAllTimestamps() {
  try {
    const store = await getStore('timestamps', 'readonly');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    handleError(error, 'Failed to retrieve timestamps');
  }
}

// Calculate the scheduled time based on the current timestamp
function getScheduledTime(now) {
  const times = ['07:36', '07:52', '08:36'].map(
    t => new Date(`${new Date().toDateString()} ${t}`)
  );
  return times.find(time => now <= time) || times[times.length - 1];
}

// Function to clear all timestamps from the database
async function clearAllTimestamps() {
  try {
    const store = await getStore('timestamps', 'readwrite');
    const request = store.clear();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    handleError(error, 'Failed to clear timestamps');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const nowButton = document.getElementById('nowButton');
  const logButton = document.getElementById('logButton');
  const logView = document.getElementById('logView');
  const closeModal = document.getElementById('closeModal');
  const clearLog = document.getElementById('clearLog');
  const modalContent = document.getElementById('modalContent');
  const timestampDisplay = document.getElementById('timestampDisplay');

  let timeoutHandle;

  nowButton.addEventListener('click', async () => {
    clearTimeout(timeoutHandle);
    const now = new Date();
    const scheduledTime = getScheduledTime(now);
    await addTimestamp(now, scheduledTime);
    logButton.style.display = 'block'; // Show the log button if it was hidden
    timestampDisplay.textContent = `${now.toLocaleString()}`;
    timestampDisplay.style.display = 'block';
    timeoutHandle = setTimeout(() => {
      timestampDisplay.style.display = 'none';
    }, 3000);
  });

  logButton.addEventListener('click', async () => {
    const timestamps = await getAllTimestamps();
    const logContent = timestamps
      .map(
        t =>
          `<tr><td>${new Date(t.timestamp).toLocaleString()}</td><td>${new Date(
            t.scheduledTime
          ).toLocaleString()}</td></tr>`
      )
      .join('');
    modalContent.innerHTML = `<table><tr><th>Timestamp</th><th>Scheduled Time</th></tr>${logContent}</table>`;
    logView.style.display = 'block'; // Show the log modal
    closeModal.style.display = 'block'; // Show the close button
    clearLog.style.display = 'block'; // Show the clear log button
  });

  closeModal.addEventListener('click', () => {
    logView.style.display = 'none';
    closeModal.style.display = 'none';
    clearLog.style.display = 'none';
  });

  clearLog.addEventListener('click', async () => {
    try {
      await clearAllTimestamps();
      modalContent.innerHTML = ''; // Clear the modal content
      // Display a user-friendly message directly in the UI
      displayUserMessage('All log entries have been cleared.');
    } catch (error) {
      // Handle errors specifically related to log clearing
      displayUserMessage('Failed to clear the log entries.');
    }
  });

  function displayUserMessage(message) {
    const messageElement = document.getElementById('messageArea');
    messageElement.textContent = message;
    messageElement.style.display = 'block';

    // Optionally hide the message after a few seconds
    setTimeout(() => {
      messageElement.style.display = 'none';
    }, 3000);
  }

  logView.addEventListener('click', event => {
    if (event.target === logView) {
      logView.style.display = 'none';
      closeModal.style.display = 'none';
      clearLog.style.display = 'none';
    }
  });
});
