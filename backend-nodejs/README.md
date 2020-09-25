# Project Tello
## Backend service
In this directory, the backend service files of the Tello project can be found. The source code for the Node.js backend service is [WebService.js](./WebService.js). In the folder [static](./static) are compiled angular frontend files.

## REST API
The communication between angular frontend and Node.js backend service are over REST API calls.

```
Base URL: ./api/v1
```
> *Note: Since the frontend web page are compiled files integrated in the Node.js backend through the folder `static`, there's no need to enter a common URL or localhost. Instead, we can call the API from the current point.*

The web frontend makes an API request frequently to get almost live data of the drone's current state. The answer is passed by the Node.js backend web service.

```
GET     BASE_URL/currentStatus
```
Response on *success* in JSON format:
```json
{
    "status": 200,
    "statusText": "OK",
    "message": "delivery of current values",
    "data": {
        "pitch": 0,
        "roll": 0,
        "yaw": 0,
        "vgx": 0,
        "vgy": 0,
        "vgz": 0,
        "templ": 0,
        "temph": 0,
        "tof": 0,
        "h": 0,
        "bat": 0,
        "baro": 0,
        "time": 0,
        "agx": 0,
        "agy": 0,
        "agz": 0
    }
}
```
> *Note: Since there is no authentication, this request should not fail as long as the backend service is running. The zeros in `data` will be the current values from Tello.*

<br>
Through clicks on the blue buttons or using the height slider, commands can be sent to the drone.

```
POST     BASE_URL/command
```
Body:
```
command     The command you like to send to the drone
            String

value       The value to this command
            Integer
```

> *Note: Both body fields are mandatory. If the value is not necessary for a command e. g. flip, then just pass any Integer value (e. g. 0) which will be ignored.*

Response on *success* in JSON format:
```json
{
    "status": 202,
    "statusText": "Accepted",
    "message": "Received command successfully"
}
```
Response on *failure* if Tello didn't accept command in JSON format:
```json
{
    "status": 406,
    "statusText": "Not Acceptable",
    "message": "ERROR MESSAGE"
}
```
Response on *failure* on sending command to Tello in JSON format:
```json
{
    "status": 409,
    "statusText": "Conflict",
    "message": "ERROR MESSAGE"
}
```
> *Note: On response `406 - Not Acceptable` the error message often will be `error`, since the Tello drone doesn't deliver detailed error messages.*

## UDP to Tello
Tello works like a WLan hotspot, where a client can connect to it. Tello has always the IP address `192.168.10.1`. Commands and state querys are limited, since they are given from Ryze Tech. Which commands are processed by Tello can be found in the [documentation](../docs/Tello_SDK_Documentation.pdf).

## Rights
![CC BY-SA](https://mirrors.creativecommons.org/presskit/buttons/88x31/svg/by-sa.svg) Mithusan Sivakumar, FHNW