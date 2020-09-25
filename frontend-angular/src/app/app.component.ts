import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions } from '@angular/material/tooltip';


const customTooltipConfig: MatTooltipDefaultOptions = {
  showDelay: 1000,
  hideDelay: 0,
  touchendHideDelay: 0
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [{ provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: customTooltipConfig }]
})

export class AppComponent implements OnInit {

  value = 50;
  apiBaseUrl = './api/v1';

  telloState = {
    pitch: 0,
    roll: 0,
    yaw: 0,
    vgx: 0,
    vgy: 0,
    vgz: 0,
    templ: 0,
    temph: 0,
    tof: 0,
    h: 0,
    bat: 0,
    baro: 0,
    time: 0,
    agx: 0,
    agy: 0,
    agz: 0
  };

  commandSent = false;

  currentHeight = 0;
  currentVelocity = 0;
  currentAcceleration = 0;
  currentTemperature = 0;

  droneHeight = '87%';
  droneHeightSlider = '52%';
  droneRoll = 'rotate(0deg)';
  droneRollPos = 30;
  droneRollPosStr = '30%';

  constructor(private http: HttpClient, private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.readTelloState();
  }

  sendTelloCommand(cmd, val): void {
    const apiUrl = this.apiBaseUrl + '/command';
    const body = {
      command: cmd,
      value: val
    };

    if (cmd !== 'emergency') {
      this.commandSent = true;
    }
    this.http.post<any>(apiUrl, body).subscribe(
      () => {
        this.commandSent = false;
        this.snackBar.open('Command successfully sent!', '', {
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          duration: 2000,
          panelClass: ['snackBar-successAPI']
        });
      },
      apiError => {
        this.commandSent = false;
        const snackBarRef = this.snackBar.open('Some error occured!', 'Show error', {
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
          duration: 5000,
          panelClass: ['snackBar-failedAPI']
        });

        console.log(apiError);

        snackBarRef.onAction().subscribe(() => {
          alert('Response:\n' + apiError.status + ' ' + apiError.statusText + '\n' + apiError.message);
        });
      }
    );
  }

  onCommandButtonClick(event): void {
    this.sendTelloCommand(event.currentTarget.id, this.value);
  }

  readTelloState(): void {
    const apiUrl = this.apiBaseUrl + '/currentStatus';
    this.http.get<any>(apiUrl).subscribe(
      async apiRes => {
        this.telloState = apiRes.data;

        this.telloState.h = Math.max(0, Math.min(this.telloState.h, 200));
        this.currentHeight = this.telloState.h;

        this.droneHeight = Math.max(0, Math.min(((this.telloState.h * (-17 / 40)) + 80), 80)) + '%';
        this.droneHeightSlider = Math.max(0, Math.min(52, ((this.telloState.h * (-47 / 200)) + 52))) + '%';
        this.droneRoll = 'rotate(' + (this.telloState.roll * (-1)) + 'deg)';

        this.currentVelocity = Math.round(Math.sqrt(Math.pow(this.telloState.vgx, 2) +
                                                    Math.pow(this.telloState.vgy, 2) +
                                                    Math.pow(this.telloState.vgz, 2)));

        this.currentAcceleration = Math.round(Math.sqrt(Math.pow(this.telloState.agx, 2) +
                                                        Math.pow(this.telloState.agy, 2) +
                                                        Math.pow(this.telloState.agz, 2)));

        this.currentTemperature = ((this.telloState.templ + this.telloState.temph) / 2);

        if (this.telloState.roll > 2) {
          this.droneRollPos = Math.max(this.droneRollPos - 0.5, -5);
          if (this.telloState.roll > 10) {
            this.droneRollPos = Math.max(this.droneRollPos - 0.5, -5);
          }
        } else if (this.telloState.roll < -2) {
          this.droneRollPos = Math.min(this.droneRollPos + 0.5, 60);
          if (this.telloState.roll < -10) {
            this.droneRollPos = Math.min(this.droneRollPos + 0.5, 60);
          }
        }
        this.droneRollPosStr = this.droneRollPos + '%';

        await this.delay(10);
        this.readTelloState();
      },
      async err => {
        // console.error(err);
        await this.delay(10);
        // this.readTelloState();
      }
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  onHeightChange(event): void {
    const delta = event.value - this.telloState.h;
    if (Math.abs(delta) >= 20) {
      if (delta > 0) {
        this.sendTelloCommand('up', Math.abs(delta));
      } else {
        this.sendTelloCommand('down', Math.abs(delta));
      }
    }
  }
}
