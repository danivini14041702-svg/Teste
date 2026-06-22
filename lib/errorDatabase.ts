import { supabase } from './supabase';

export interface ErrorPattern {
  id: string;
  pattern: string;
  category: string;
  error_name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  what_it_means: string;
  common_causes: string[];
  possible_solutions: string[];
  keywords: string[];
  match_score?: number;
}

export async function matchErrorsFromDatabase(logContent: string): Promise<ErrorPattern[]> {
  try {
    const { data, error } = await supabase.rpc('match_error_patterns', {
      search_text: logContent,
    });

    if (error) {
      console.error('Error matching patterns:', error);
      return getLocalFallbackErrors(logContent);
    }

    if (!data || data.length === 0) {
      return getLocalFallbackErrors(logContent);
    }

    return data.map((item: any) => ({
      id: item.id,
      pattern: item.pattern,
      category: item.category,
      error_name: item.error_name,
      severity: item.severity,
      what_it_means: item.what_it_means,
      common_causes: item.common_causes || [],
      possible_solutions: item.possible_solutions || [],
      keywords: item.keywords || [],
      match_score: item.match_score,
    }));
  } catch (err) {
    console.error('Exception in matchErrorsFromDatabase:', err);
    return getLocalFallbackErrors(logContent);
  }
}

function getLocalFallbackErrors(logContent: string): ErrorPattern[] {
  const patterns = [
    {
      pattern: 'NullPointerException',
      category: 'java',
      error_name: 'NullPointerException',
      severity: 'high' as const,
      what_it_means: 'O codigo tentou acessar um objeto que nao existe.',
      common_causes: ['Variavel nao inicializada', 'Objeto removido da memoria', 'Busca retornou vazio'],
      possible_solutions: ['Reinicie o aplicativo', 'Verifique todos os campos', 'Reporte se persistir'],
    },
    {
      pattern: 'OutOfMemoryError',
      category: 'java',
      error_name: 'OutOfMemoryError',
      severity: 'critical' as const,
      what_it_means: 'O aplicativo esgotou toda a memoria disponivel.',
      common_causes: ['Arquivos muito grandes', 'Varios apps abertos', 'Vazamento de memoria'],
      possible_solutions: ['Feche outros apps', 'Reinicie o celular', 'Use arquivos menores'],
    },
    {
      pattern: 'FATAL EXCEPTION',
      category: 'android',
      error_name: 'Fatal Exception',
      severity: 'critical' as const,
      what_it_means: 'O aplicativo travou completamente e foi fechado pelo sistema.',
      common_causes: ['Bug grave no codigo', 'Dados corrompidos', 'Memoria insuficiente'],
      possible_solutions: ['Reinicie o aplicativo', 'Atualize o app', 'Reporte ao desenvolvedor'],
    },
  ];

  const found: ErrorPattern[] = [];
  for (const p of patterns) {
    if (logContent.includes(p.pattern)) {
      found.push({
        id: `fallback-${p.pattern}`,
        ...p,
        keywords: [],
      });
    }
  }

  if (found.length === 0) {
    found.push({
      id: 'generic-error',
      pattern: 'generic',
      category: 'general',
      error_name: 'Erro Detectado',
      severity: 'medium',
      what_it_means: 'O log contem erros que precisam de analise.',
      common_causes: ['Comportamento inesperado', 'Dados inconsistentes', 'Conflito com sistema'],
      possible_solutions: ['Reinicie o app', 'Verifique atualizacoes', 'Reporte ao desenvolvedor'],
      keywords: [],
      match_score: 1,
    });
  }

  return found;
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return '#DC2626';
    case 'high':
      return '#EA580C';
    case 'medium':
      return '#D97706';
    case 'low':
      return '#65A30D';
    default:
      return '#6B7280';
  }
}

export function getSeverityLabel(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'Critico';
    case 'high':
      return 'Alto';
    case 'medium':
      return 'Medio';
    case 'low':
      return 'Baixo';
    default:
      return 'Desconhecido';
  }
}

export function getCategoryLabel(category: string): string {
  switch (category) {
    case 'android':
      return 'Android';
    case 'java':
      return 'Java';
    case 'flutter':
      return 'Flutter';
    case 'install':
      return 'Instalacao';
    default:
      return 'Geral';
  }
}

export function getCategoryIcon(category: string): string {
  switch (category) {
    case 'android':
      return 'smartphone';
    case 'java':
      return 'coffee';
    case 'flutter':
      return 'wind';
    case 'install':
      return 'download';
    default:
      return 'alert-circle';
  }
}
