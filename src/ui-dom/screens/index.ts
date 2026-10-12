import type { ScreenId } from '../../store/GameStore';
import type { KeyHandler, ScreenCtx, ScreenRenderer } from '../types';
import { CreateScreen } from './CreateScreen';
import { ErrorScreen } from './ErrorScreen';
import { MenuScreen } from './MenuScreen';

/** Registro de telas. Cada task de tela acrescenta a sua aqui. */
export const SCREENS: Partial<Record<ScreenId, ScreenRenderer>> = {
  menu: MenuScreen,
  error: ErrorScreen,
  create: CreateScreen,
};

export const KEYS: Partial<Record<ScreenId, KeyHandler>> = {};

export const OVERLAY: ((ctx: ScreenCtx) => HTMLElement | null) | null = null;
