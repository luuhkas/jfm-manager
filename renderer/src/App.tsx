import PontoPage from './modules/ponto/PontoPage';
import { ErrorBoundary } from './ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <PontoPage />
    </ErrorBoundary>
  );
}

export default App;