import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { PasswordStrengthMeterService } from 'angular-password-strength-meter';
import { Location } from '@angular/common';

import { encode } from 'url-safe-base64';

import { CryptoService } from '../crypto.service';
import { ConstantsService } from '../constants.service';

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
  passPhaseVerified: boolean;
  message: string;
  encoded: string;
  encodingErrorMessage: string;
  encryptedText: string;
  includeUrl: boolean;
  qrContent: string;
}

@Injectable()
export class EncodeStore extends ComponentStore<EncodeState> {
  readonly passPhaseVerified$ = this.select((state) => state.passPhaseVerified);
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
    (state, encryptedText, qrContent) => ({
      ...state,
      encryptedText,
      qrContent,
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
      passPhaseVerified: false,
      confirmPassPhase: '',
      message: '',
      encoded: '',
      encryptedText: '',
      encodingErrorMessage: '',
      includeUrl: true,
      qrContent: '',
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
      encodingErrorMessage: '',
      encoded: '',
    };
  });

  readonly setConfirmPassPhase = this.updater(
    (state, confirmPassPhase: string) => {
      confirmPassPhase = confirmPassPhase?.trim();
      const passPhaseVerified =
        !!confirmPassPhase && confirmPassPhase === state.passPhase;
      return {
        ...state,
        confirmPassPhase,
        passPhaseVerified,
        ...this.getEncryptedValues({
          ...state,
          passPhaseVerified,
        }),
      };
    }
  );

  readonly setMessage = this.updater((state, message: string) => {
    message = message?.trim();

    return {
      ...state,
      message,
      ...this.getEncryptedValues({
        ...state,
        message,
      }),
    };
  });

  // Helpers

  getEncryptedValues(state: EncodeState) {
    let encodingErrorMessage = '';
    let encoded = '';

    if (state.passPhaseVerified) {
      try {
        encoded = this.crypto.encode(state.message, state.passPhase);
      } catch (e: any) {
        console.error(e);
        encodingErrorMessage = e.message;
      }
    }

    return {
      encoded,
      encodingErrorMessage,
    };
  }
}
