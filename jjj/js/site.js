// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.

window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB ||
    window.msIndexedDB;

window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction ||
    window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange ||
    window.webkitIDBKeyRange || window.msIDBKeyRange

function loadFromIndexedDB(storeName, id) {
    return new Promise(
        function (resolve, reject) {
            var dbRequest = indexedDB.open(storeName);

            dbRequest.onerror = function (event) {
                reject(Error("Error text"));
            };

            dbRequest.onupgradeneeded = function (event) {
                // Objectstore does not exist. Nothing to load
                event.target.transaction.abort();
                reject(Error('Not found'));
            };

            dbRequest.onsuccess = function (event) {
                var database = event.target.result;
                var transaction = database.transaction([storeName]);
                var objectStore = transaction.objectStore(storeName);
                var objectRequest = objectStore.get(id);

                objectRequest.onerror = function (event) {
                    reject(Error('Error text'));
                };

                objectRequest.onsuccess = function (event) {
                    if (objectRequest.result) resolve(objectRequest.result);
                    else reject(Error('object not found'));
                };
            };
        }
    );
}

function saveToIndexedDB(storeName, object) {
    return new Promise(
        function (resolve, reject) {
            if (object.id === undefined) reject(Error('object has no id.'));
            var dbRequest = indexedDB.open(storeName);

            dbRequest.onerror = function (event) {
                reject(Error("IndexedDB database error"));
            };

            dbRequest.onupgradeneeded = function (event) {
                var database = event.target.result;
                var objectStore = database.createObjectStore(storeName, { keyPath: "id" });
            };

            dbRequest.onsuccess = function (event) {
                var database = event.target.result;
                var transaction = database.transaction([storeName], 'readwrite');
                var objectStore = transaction.objectStore(storeName);
                var objectRequest = objectStore.put(object); // Overwrite if exists

                objectRequest.onerror = function (event) {
                    reject(Error('Error text'));
                };

                objectRequest.onsuccess = function (event) {
                    //resolve('Data saved OK');
                };
            };
        }
    );
}

var title = document.title;
var currentMessageCount = 0;
var isChecked = false;

var notiAudio = new Audio("https://orangefreesounds.com/wp-content/uploads/2015/04/Elevator-ding-sound-effect.mp3");
notiAudio.muted = true;
notiAudio.volume = 0.1;

function UpdateMessageUnreadCount(msg) {
    $.ajax({
        url: "/GetUnreadMessageCount",
        type: 'GET',
        dataType: 'json', // added data type
        success: function (unReadNum)
        {
            if (unReadNum < 0) {
                return;
            }

            var spanTag = document.getElementById('notif_num');
            spanTag.textContent = unReadNum.toString();

            var notiTag = document.getElementById('notif_id');
            var noNotiTag = document.getElementById('no_notif_id');

            if (unReadNum == 0)
            {
                notiTag.style.display = "none";
                spanTag.style.display = "none";
                noNotiTag.style.display = "block";

                document.title = title;
            }
            else
            {
                spanTag.style.display = "block";
                notiTag.style.display = "block";
                noNotiTag.style.display = "none";

                //Change title
                document.title = "(" + unReadNum + ") " + title;
            }

            if (isChecked == true && unReadNum > currentMessageCount) //notification sound
            {
                notiAudio.muted = false;
                notiAudio.play();
            }

            currentMessageCount = unReadNum;
            isChecked = true;
        }
    });
}

var connection = new signalR.HubConnectionBuilder()
    .withUrl("/messenger/chathub", {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
    })
    .configureLogging(signalR.LogLevel.Information)
    .withAutomaticReconnect()
    .build();

connection["ServerTimeout"] = 60;
connection["KeepAliveInterval"] = 30;
connection.on("KeepAlive", function () { console.log("ChatHub KeepAlive") });
connection.on("ReceiveMessage", UpdateMessageUnreadCount);
connection.on("ReceiveUserStatus", function (result) {

});

async function start() {
    try
    {
        await connection.start();
        UpdateMessageUnreadCount();
    }
    catch (err) { };
};

start();

