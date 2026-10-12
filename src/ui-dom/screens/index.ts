import type { ScreenId } from '../../store/GameStore';
import type { KeyHandler, ScreenCtx, ScreenRenderer } from '../types';
import { CreateScreen } from './CreateScreen';
import { ErrorScreen } from './ErrorScreen';
import { MapScreen } from './MapScreen';
import { MenuScreen } from './MenuScreen';
import { swapOverlay } from '../components/swap';
import { PrepScreen } from './PrepScreen';
import { SheetScreen } from './SheetScreen';
import { ResultScreen } from './ResultScreen';
import { RunEndScreen } from './RunEndScreen';
import { EncyclopediaScreen } from './EncyclopediaScreen';
import { HistoryScreen } from './HistoryScreen';
import { TitlesScreen } from './TitlesScreen';

/** Registro de telas. Cada task de tela acrescenta a sua aqui. */
export const SCREENS: Partial<Record<ScreenId, ScreenRenderer>> = {
  menu: MenuScreen,
  error: ErrorScreen,
  create: CreateScreen,
  map: MapScreen,
  result: ResultScreen,
  runEnd: RunEndScreen,
  prep: PrepScreen,
  sheet: SheetScreen,
  encyclopedia: EncyclopediaScreen,
  history: HistoryScreen,
  titles: TitlesScreen,
};

export const KEYS: Partial<Record<ScreenId, KeyHandler>> = {};

export const OVERLAY: ((ctx: ScreenCtx) => HTMLElement | null) | null = swapOverlay;
