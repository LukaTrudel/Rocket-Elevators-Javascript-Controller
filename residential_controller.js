let elevatorID = 1
let floorRequestButtonID = 1
let callButtonID = 1

console.log("GO_HABS_GO")


class Column {
    constructor(_id, _amountOfFloors, _amountOfElevators) {
        this.ID = _id
        this.status = columnStatus.ACTIVE
        this.amountOfFloors = _amountOfFloors
        this.amountOfElevators = _amountOfElevators
        this.elevatorList = []
        this.callButtonList = []

        this.createElevators(_amountOfFloors, _amountOfElevators)
        this.createCallButtons(_amountOfFloors)

        console.log("Column:", this.ID)
        console.log("Floors:", this.amountOfFloors)
        console.log("Elevators:", this.amountOfElevators)

    };

    createCallButtons(_amountOfFloors) {
        let buttonFloor = 1

        for (let i = 0; i < _amountOfFloors; i++) {
            if (buttonFloor < _amountOfFloors) {
                let callButton = new CallButton(callButtonID, 'off', buttonFloor, 'up')
                this.callButtonList.push(callButton)
                callButtonID++
            }

            if (buttonFloor >= 2) {
                let callButton = new CallButton(callButtonID, 'off', buttonFloor, 'down')
                this.callButtonList.push(callButton)
                callButtonID++
            }
            buttonFloor++
        }
    
    }

    createElevators(_amountOfFloors, _amountOfElevators) {
        for (let i = 0; i < _amountOfElevators; i++) {
            let elevator = new Elevator(elevatorID, _amountOfFloors)
            this.elevatorList.push(elevator)
            elevatorID++
        }
    }

    requestElevator(_floor, _direction) {
        console.log("-CLIENT CALLS THE ELEVATOR AT FLOOR " + _floor + " TO GO " + _direction + "-");
        let elevator = this.findElevator(_floor, _direction)
        elevator.floorRequestList.push(_floor)
        elevator.sortFloorList()
        console.log()
        console.log("ELEVATOR " + elevator.ID + " MOVING FROM FLOOR " + elevator.currentFloor + " TO FLOOR " + _floor)
        elevator.move()
        elevator.operateDoors()
        return elevator
    };

    findElevator(requestedFloor, requestedDirection) {
        let bestElevatorInformations = {
            bestElevator: null,
            bestScore: 5,
            referenceGap: 10000000
        }

        this.elevatorList.forEach(elevator => {
            
            if (requestedFloor == elevator.currentFloor && elevator.status == 'stopped' && requestedDirection == elevator.direction) {
                bestElevatorInformations = this.checkIfElevatorIsBetter(1, elevator, bestElevatorInformations, requestedFloor)
            }
            else if (requestedFloor > elevator.currentFloor && elevator.direction == 'up' && requestedDirection == elevator.direction) {
                bestElevatorInformations = this.checkIfElevatorIsBetter(2, elevator, bestElevatorInformations, requestedFloor)
            }
            else if (requestedFloor < elevator.currentFloor && elevator.direction == 'down' && requestedDirection == elevator.direction) {
                bestElevatorInformations = this.checkIfElevatorIsBetter(2, elevator, bestElevatorInformations, requestedFloor)
            }
            else if (elevator.status == 'idle') {
                bestElevatorInformations = this.checkIfElevatorIsBetter(3, elevator, bestElevatorInformations, requestedFloor)
            }
            else {
                bestElevatorInformations = this.checkIfElevatorIsBetter(4, elevator, bestElevatorInformations, requestedFloor)
            }
            let bestElevator = bestElevatorInformations.bestElevator
            let bestScore = bestElevatorInformations.bestScore
            let referenceGap = bestElevatorInformations.referenceGap
        });
        console.log();
        console.log(">>[ELEVATOR SENT]:");
        console.log(bestElevatorInformations.bestElevator);
        return bestElevatorInformations.bestElevator
    }

    checkIfElevatorIsBetter(scoreToCheck, newElevator, bestElevatorInformations, floor) {
        if (scoreToCheck < bestElevatorInformations.bestScore) {
            bestElevatorInformations.bestScore = scoreToCheck
            bestElevatorInformations.bestElevator = newElevator
            bestElevatorInformations.referenceGap = Math.abs(newElevator.currentFloor - floor)
        } else if (bestElevatorInformations.bestScore == scoreToCheck) {
            let gap = Math.abs(newElevator.currentFloor - floor)
            if (bestElevatorInformations.referenceGap > gap) {
                bestElevatorInformations.bestScore = scoreToCheck
                bestElevatorInformations.bestElevator = newElevator
                bestElevatorInformations.referenceGap = gap
            }
        }
        return bestElevatorInformations
    }
}

class Elevator {
    constructor(_id, _amountOfFloors) {
        this.ID = _id
        this.status = elevatorStatus.IDLE
        this.amountOfFloors = _amountOfFloors
        this.currentFloor = 1
        this.direction;
        this.door = new Door(_id)
        this.floorRequestButtonList = []
        this.floorRequestList = []

        this.createFloorRequestButtons(_amountOfFloors)

    }


    createFloorRequestButtons(_amountOfFloors) {
        let buttonFloor = 1
        for(let i = 0; i < _amountOfFloors; i++){
            let floorRequesButton = new FloorRequestButton(floorRequestButtonID, 'off', buttonFloor)
            this.floorRequestButtonList.push(floorRequesButton)
            buttonFloor++
            floorRequestButtonID++
        }
    }

    requestFloor(_floor) {
        this.floorRequestList.push(_floor)
        this.move()
        this.operateDoors()
    }

    move() {   
        while (this.floorRequestList.length != 0){
            let destination = this.floorRequestList[0]
            this.status = 'moving'
            if (this.currentFloor < destination){
                this.direction = 'up'
                while (this.currentFloor < destination){
                    this.currentFloor++
                }
            }
            else if (this.currentFloor > destination){
                this.direction = 'down'
                while (this.currentFloor > destination){
                    this.currentFloor--
                }
            }
            this.status = 'stopped'
            this.floorRequestList.shift()
        }
        this.status = 'idle'
    }  
    sortFloorList() {
        if (this.direction == 'up') {
            this.floorRequestList.sort(function (a, b) { return a - b });
        } else {
            this.floorRequestList.sort(function (a, b) { return b - a });
        }
    }
    operateDoors() {
        this.doorStatus = 'opened'
        //WAIT 5 SECONDS//
        if (!this.overweight) {
            this.door.status = 'closing'
            if (!this.door.obstruction) {
                this.door.status = 'closed'
            } else {
                this.door.obstruction = false
                this.operateDoors()
            }
        } else {
            while (this.overweight) {
                this.overweight = false
            }
            this.operateDoors()
        }
    } 
}

class CallButton {
    constructor(_id, _floor, _direction) {
        this.ID = _id
        this.status = buttonStatus.OFF
        this.floor = _floor
        this.direction = _direction
    

    }
}

class FloorRequestButton {
    constructor(_id, _floor) {
        this.ID = _id
        this.status = buttonDirection.UP
        this.floor = 1

    }
}

class Door {
    constructor(_id) {
        this.ID = _id
        this.status = doorStatus.OPENED

    }
}


const columnStatus = {
    ACTIVE: 'active',
    INACTIVE: 'inactive'
};


const elevatorStatus = {
    IDLE: 'idle',
    UP: 'up',
    DOWN: 'down'
};


const buttonDirection = {
    UP: 'up',
    DOWN: 'down'
};


const buttonStatus = {
    ON: 'on',
    OFF: 'off'
};


const sensorStatus = {
    ON: 'on',
    OFF: 'off'
};


const doorStatus = {
    OPENED: 'opened',
    CLOSED: 'closed'
};

module.exports = { Column, Elevator, CallButton, FloorRequestButton, Door }