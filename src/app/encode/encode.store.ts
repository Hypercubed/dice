import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { PasswordStrengthMeterService } from 'angular-password-strength-meter';
import { Location } from '@angular/common';

import { encode } from 'url-safe-base64';

import { CryptoService } from '../crypto.service';
import { ConstantsService } from '../constants.service';
import { pipe, tap, withLatestFrom } from 'rxjs';

function cleanJoin(strings: Array<string | undefined>) {
  strings = strings
    .map((s) => {
      s = s?.trim();
      if (s) {
        if (s?.endsWith('.')) {
          return s.replace(/.$/, '');
        }
      }
      return s;
    })
    .filter(Boolean);

  if (strings.length > 1) {
    strings.push('');
  }

  return strings.join('. ');
}

function formatString(encrypted: string) {
  let display = '';
  for (let i = 0; i < encrypted.length; i += 4) {
    display += encrypted.substring(i, i + 4) + ' ';
  }
  return display;
}

const SCORE_TEXT = ['very weak', 'weak', 'better', 'medium', 'strong'];

export interface EncodeState {
  passPhase: string;
  confirmPassPhase: string;
  passPhaseHint: string;
  passPhaseSuggestions: string;
  message: string;
  encoded: string;
  encodingErrorMessage: string;
  encryptedText: string;
  includeUrl: boolean;
  errorCorrection: number;
}

@Injectable()
export class EncodeStore extends ComponentStore<EncodeState> {
  readonly passPhaseVerified$ = this.select((state) => {
    return (
      !!state.confirmPassPhase && state.confirmPassPhase === state.passPhase
    );
  });

  readonly encryptedText$ = this.select((state) => {
    if (!state.encoded || state.encodingErrorMessage) return '';
    return formatString(state.encoded);
  });

  readonly qrContent$ = this.select((state) => {
    if (!state.encoded || state.encodingErrorMessage) return '';

    return state.includeUrl
      ? Location.joinWithSlash(
          this.constantsService.baseURI,
          this.location.prepareExternalUrl('decode/' + encode(state.encoded))
        )
      : state.encoded;
  });

  readonly vm$ = this.select(
    this.state$,
    this.encryptedText$,
    this.qrContent$,
    this.passPhaseVerified$,
    (state, encryptedText, qrContent, passPhaseVerified) => ({
      ...state,
      encryptedText,
      qrContent,
      passPhaseVerified,
    })
  );

  constructor(
    private readonly passwordStrengthMeterService: PasswordStrengthMeterService,
    private readonly crypto: CryptoService,
    private readonly location: Location,
    private readonly constantsService: ConstantsService
  ) {
    super({
      passPhase: '',
      passPhaseHint: '',
      passPhaseSuggestions: '',
      confirmPassPhase: '',
      message: '',
      encoded: '',
      encryptedText: '',
      encodingErrorMessage: '',
      includeUrl: true,
      errorCorrection: 3,
    });
  }

  readonly setPassPhase = this.updater((state, passPhase: string) => {
    passPhase = passPhase?.trim();

    if (!passPhase) {
      return {
        ...state,
        passPhase: passPhase,
        passPhaseHint: 'Enter an pass phase',
        passPhaseSuggestions: '',
      };
    }

    const { score, feedback } =
      this.passwordStrengthMeterService.scoreWithFeedback(passPhase);

    return {
      ...state,
      confirmPassPhase: '',
      passPhaseVerified: false,
      passPhase,
      passPhaseHint: cleanJoin([
        `Pass phase is ${SCORE_TEXT[score]}`,
        feedback?.warning,
      ]),
      passPhaseSuggestions: cleanJoin(feedback?.suggestions || []),
    };
  });

  // Effects

  readonly encode = this.effect<void>(
    pipe(
      withLatestFrom(this.state$, this.passPhaseVerified$),
      tap(([, state, passPhaseVerified]) => {
        let encodingErrorMessage = '';
        let encoded = '';

        if (passPhaseVerified) {
          try {
            encoded = this.crypto.encode(state.message, state.passPhase);
          } catch (e: any) {
            console.error(e);
            encodingErrorMessage = e.message;
          }
        }

        this.patchState({
          encoded,
          encodingErrorMessage,
        });
      })
    )
  );
}
