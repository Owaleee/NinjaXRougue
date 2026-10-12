import './styles.css';
import { t } from './i18n/pt-BR';

// Provisório: a Task 6 troca este arquivo pela montagem do App e do GameStore.
const root = document.getElementById('app');
if (root) root.textContent = t('app.title');
