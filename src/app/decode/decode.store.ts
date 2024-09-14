import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { pipe, switchMap, tap, withLatestFrom } from 'rxjs';
import { ConstantsService } from '../constants.service';
import { CryptoService } from '../crypto.service';

export interface DecodeState {
  passPhase: string;
  passPhaseConfirmed: boolean;
  decryptionSuccess: boolean;
  encoded: string;
  decrypted: string;
  showPassPhase: boolean;
  decryptionAttempted: boolean;
  base64Encoded: string;
}

const a = new AudioContext(); // browsers limit the number of concurrent audio contexts, so you better re-use'em

function beep(vol: number, freq: number, duration: number) {
  const v = a.createOscillator();
  const u = a.createGain();
  v.connect(u);
  v.frequency.value = freq;
  v.type = 'square';
  u.connect(a.destination);
  u.gain.value = vol * 0.01;
  v.start(a.currentTime);
  v.stop(a.currentTime + duration * 0.001);
}

@Injectable()
export class DecodeStore extends ComponentStore<DecodeState> {
  readonly vm$ = this.select(this.state$, (state) => ({
    ...state,
  }));

  readonly base64Encoded$ = this.select((state) => {
    return state.base64Encoded;
  });

  constructor(private readonly crypto: CryptoService, private readonly constantsService: ConstantsService) {
    super({
      passPhase: '',
      passPhaseConfirmed: false,
      decryptionSuccess: false,
      encoded: '',
      decrypted: '',
      showPassPhase: false,
      decryptionAttempted: false,
      base64Encoded: '',
    });
  }

  readonly decode = this.effect<void>(
    pipe(
      withLatestFrom(this.state$),
      switchMap(async ([, state]) => {
        let decryptionAttempted = false;
        let decryptionSuccess = false;
        let decrypted = '';

        if (state.passPhaseConfirmed && state.encoded && state.passPhase) {
          decryptionAttempted = true;
          decrypted = await this.crypto.decode(state.encoded, state.passPhase);
          if (decrypted) {
            decryptionSuccess = true;
            if (this.constantsService.isMobile) {
              beep(100, 520, 200);
              navigator.vibrate(200);
            }
          } else {
            decryptionSuccess = false;
            if (this.constantsService.isMobile) {
              beep(999, 220, 300);
              navigator.vibrate(1000);
            }
          }
        }

        this.patchState({
          decryptionSuccess,
          decryptionAttempted,
          decrypted,
        });
      })
    )
  );
}
