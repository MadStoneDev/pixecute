let openRequest = indexedDB.open("pixecute", 1);

openRequest.onupgradeneeded = function (event) {
  // triggers if the database doesn't exist or the version is not the same
  switch (event.oldVersion) {
    case 0:
      // create the database
      let db = openRequest.result;
      break;
  }
};

openRequest.onsuccess = function (event) {
  // triggers if the database exists and the version is the same
  let db = openRequest.result;

  db.onversionchange = function (event) {
    // triggers if the database version changes
    db.close();
    alert("Database version changed. Please reload the page.");
  };
};

openRequest.onerror = function (event) {
  // triggers if there is an error
  console.log("Error opening database");
};

openRequest.onblocked = function (event) {
  // triggers if the database is blocked
  console.log("Database is blocked");
};
