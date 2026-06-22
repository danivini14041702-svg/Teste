CREATE TABLE error_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  error_name TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  what_it_means TEXT NOT NULL,
  common_causes TEXT[] NOT NULL DEFAULT '{}',
  possible_solutions TEXT[] NOT NULL DEFAULT '{}',
  keywords TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_error_patterns_keywords ON error_patterns USING GIN(keywords);
CREATE INDEX idx_error_patterns_category ON error_patterns(category);
CREATE INDEX idx_error_patterns_severity ON error_patterns(severity);

-- Enable RLS
ALTER TABLE error_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public read, authenticated write could be added later)
CREATE POLICY "public_read_patterns" ON error_patterns FOR SELECT
  TO public USING (true);

-- Insert common Android errors
INSERT INTO error_patterns (pattern, category, error_name, severity, what_it_means, common_causes, possible_solutions, keywords) VALUES
-- ANDROID SYSTEM ERRORS
('AndroidRuntime:\s*FATAL\s+EXCEPTION', 'android', 'Fatal Exception', 'critical', 
'O aplicativo travou completamente e foi fechado pelo sistema. Isso e um erro critico que impede o funcionamento do app.',
ARRAY['Bug grave no codigo do aplicativo', 'Dados corrompidos impossibilitam a execucao', 'Memoria do dispositivo insuficiente', 'Conflito com versao do Android'],
ARRAY['Reinicie o aplicativo', 'Atualize o aplicativo para versao mais recente', 'Reinstale o aplicativo', 'Reporte o erro ao desenvolvedor'],
ARRAY['fatal', 'exception', 'crash', 'androidruntime']),

('ActivityManager:\s*ANR', 'android', 'ANR - Aplicativo Nao Responde', 'critical',
'O aplicativo travou por mais de 5 segundos, deixando o usuario sem resposta. O Android encerrou o processo.',
ARRAY['Operacao pesada travando a interface', 'Loop infinito no codigo', 'Espera por rede sem resposta', 'Processamento bloqueando a thread principal'],
ARRAY['Aguarde alguns segundos', 'Feche outros aplicativos', 'Reinicie o dispositivo', 'Reporte se persistir'],
ARRAY['anr', 'travado', 'congelado', 'timeout', 'respont']),

('ActivityManager:\s*Starting\s+process', 'android', 'Processo Iniciado', 'low',
'O sistema esta iniciando um novo processo para o aplicativo. Esta e uma mensagem informativa normal.',
ARRAY['Primeira execucao do aplicativo', 'Reinicializacao apos travamento', 'Sistema iniciando componente'],
ARRAY['Nenhuma acao necessaria', 'Normal se o app funcionar corretamente'],
ARRAY['starting', 'process', 'init']),

('PackageManager:\s*Package\s+.*\s+has\s+no\s+signatures', 'android', 'Pacote Sem Assinatura', 'high',
'O aplicativo nao foi assinado corretamente ou a assinatura esta corrompida.',
ARRAY['APK corrompido durante download', 'Assinatura digital invalida', 'Versao de teste mal configurada', 'Modificacao nao autorizada do APK'],
ARRAY['Reinstale o aplicativo da loja oficial', 'Limpe dados do aplicativo', 'Baixe novamente', 'Verifique fonte do download'],
ARRAY['signature', 'package', 'invalid', 'corrompido']),

('dalvikvm:\s*Could\s+not\s+find\s+class', 'android', 'Classe Nao Encontrada', 'high',
'O aplicativo tentou usar uma classe que nao existe. Isso indica problema na instalacao ou versao.',
ARRAY['APK incompleto ou corrompido', 'Versao do Android incompativel', 'Dependencia faltando', 'Problema no build do aplicativo'],
ARRAY['Reinstale o aplicativo', 'Verifique requisitos minimos', 'Atualize o Android', 'Reporte ao desenvolvedor'],
ARRAY['class', 'not found', 'noclassdeffound']),

-- JAVA ERRORS
('java\.lang\.NullPointerException', 'java', 'NullPointerException', 'high',
'O codigo tentou acessar um objeto que nao existe. Como tentar abrir uma gaveta que nao foi instalada.',
ARRAY['Variavel nao inicializada', 'Objeto removido da memoria', 'Busca retornou vazio', 'Campo nao preenchido'],
ARRAY['Verifique todos os campos obrigatorios', 'Reinicie o aplicativo', 'Preencha dados faltantes', 'Reporte se repetir'],
ARRAY['nullpointer', 'null', 'vazio', 'objeto']),

('java\.lang\.OutOfMemoryError', 'java', 'OutOfMemoryError', 'critical',
'O aplicativo esgotou toda a memoria disponivel. Como um balde transbordando.',
ARRAY['Arquivos muito grandes', 'Varios apps abertos', 'Vazamento de memoria', 'Imagens pesadas demais'],
ARRAY['Feche outros aplicativos', 'Reinicie o celular', 'Use arquivos menores', 'Libere espaco no dispositivo'],
ARRAY['memory', 'memoria', 'oom', 'heap', 'overflow']),

('java\.lang\.IllegalStateException', 'java', 'IllegalStateException', 'high',
'O aplicativo tentou fazer uma acao no momento errado. Como tentar sacar dinheiro antes de inserir o cartao.',
ARRAY['Ordem incorreta de operacoes', 'Estado inconsistente', 'Operacao cancelada no meio', 'Conexao perdida'],
ARRAY['Reinicie o aplicativo', 'Complete cada acao antes de iniciar outra', 'Verifique conexao', 'Limpe dados do app'],
ARRAY['state', 'estado', 'invalid', 'ilegal']),

('java\.lang\.IllegalArgumentException', 'java', 'IllegalArgumentException', 'medium',
'O aplicativo recebeu um valor invalido. Como digitar letras onde se esperam numeros.',
ARRAY['Dado em formato errado', 'Valor fora do limite', 'Campo vazio onde exigia conteudo', 'Tipo incorreto'],
ARRAY['Verifique os dados inseridos', 'Use os formatos corretos', 'Preencha todos campos obrigatorios', 'Nao deixe campos em branco'],
ARRAY['argument', 'argumento', 'parametro', 'invalido']),

('java\.lang\.ClassCastException', 'java', 'ClassCastException', 'high',
'O aplicativo tentou converter algo em tipo errado. Como tentar abrir PDF como imagem.',
ARRAY['Retorno de API em formato inesperado', 'Cache desatualizado', 'Versao incompativel', 'Dados corrompidos'],
ARRAY['Limpe dados do aplicativo', 'Reinstale o app', 'Atualize para versao mais recente', 'Reporte o problema'],
ARRAY['classcast', 'conversao', 'tipo', 'cast']),

('java\.lang\.IndexOutOfBoundsException', 'java', 'IndexOutOfBoundsException', 'medium',
'Tentativa de acessar posicao que nao existe em uma lista. Como pedir o 10o item de uma lista de 5.',
ARRAY['Lista vazia', 'Indice incorreto', 'Dados removidos durante uso', 'Contagem errada de itens'],
ARRAY['Recarregue os dados', 'Tente novamente', 'Verifique conexao', 'Reporte se persistir'],
ARRAY['index', 'indice', 'bounds', 'limite']),

('java\.lang\.NumberFormatException', 'java', 'NumberFormatException', 'low',
'O aplicativo esperava um numero mas recebeu outra coisa. Como tentar calcular com palavras.',
ARRAY['Texto onde esperava numero', 'Separador decimal errado (virgula vs ponto)', 'Caracteres especiais', 'Campo vazio'],
ARRAY['Use apenas numeros', 'Verifique se usa virgula ou ponto', 'Remova caracteres especiais', 'Preencha o campo'],
ARRAY['numberformat', 'numero', 'formato']),

('java\.lang\.ArithmeticException', 'java', 'ArithmeticException', 'low',
'Erro em calculo matematico impossivel, como dividir por zero.',
ARRAY['Divisao por zero', 'Overflow numerico', 'Resultado invalido', 'Valores inconsistentes'],
ARRAY['Verifique os valores', 'Use valores dentro do limite', 'Nao deixe campos zerados onde nao permitido', 'Reporte se valores corretos'],
ARRAY['arithmetic', 'matematica', 'divisao', 'zero']),

('java\.lang\.SecurityException', 'java', 'SecurityException', 'high',
'O aplicativo tentou acessar algo sem permissao. Como tentar entrar em sala trancada.',
ARRAY['Permissao negada pelo usuario', 'Acesso a arquivo protegido', 'Operacao bloqueada pelo sistema', 'Antivirus bloqueando'],
ARRAY['Autorize as permissoes solicitadas', 'Verifique permissoes nas configuracoes', 'Desative antivirus temporariamente', 'Reinstale o aplicativo'],
ARRAY['security', 'seguranca', 'permissao', 'permission']),

('java\.lang\.RuntimeException', 'java', 'RuntimeException', 'high',
'Erro generico de execucao. O aplicativo encontrou situacao imprevista.',
ARRAY['Bug no codigo', 'Conflito com outro app', 'Versao incompativel', 'Dados corrompidos'],
ARRAY['Atualize o aplicativo', 'Reinicie o celular', 'Limpe dados do app', 'Reporte ao desenvolvedor'],
ARRAY['runtime', 'execucao', 'generic', 'erro']),

('java\.lang\.InterruptedException', 'java', 'InterruptedException', 'medium',
'Uma operacao em espera foi interrompida antes de terminar.',
ARRAY['Usuario cancelou operacao', 'Timeout expirado', 'Sistema encerrou processo', 'Conexao perdida'],
ARRAY['Tente novamente', 'Verifique sua conexao', 'Nao cancele operacoes no meio', 'Aguarde mais tempo'],
ARRAY['interrupted', 'interrompido', 'thread']),

('java\.io\.IOException', 'java', 'IOException', 'medium',
'Problema ao ler ou gravar dados. A transferencia de informacoes falhou.',
ARRAY['Conexao instavel', 'Armazenamento cheio', 'Arquivo corrompido', 'Dispositivo removido'],
ARRAY['Verifique conexao', 'Libere espaco', 'Reinicie o aplicativo', 'Reinsira o dispositivo'],
ARRAY['io', 'input', 'output', 'arquivo']),

('java\.io\.FileNotFoundException', 'java', 'FileNotFoundException', 'medium',
'O arquivo procurado nao existe ou foi movido.',
ARRAY['Arquivo excluido', 'Caminho incorreto', 'Cartao removido', 'Arquivo ainda sendo salvo'],
ARRAY['Verifique se arquivo existe', 'Reinsira cartao de memoria', 'Reinstale o app', 'Baixe novamente'],
ARRAY['filenotfound', 'arquivo', 'nao encontrado']),

('java\.net\.SocketException', 'java', 'SocketException', 'medium',
'A conexao de rede falhou ou foi interrompida.',
ARRAY['Internet instavel', 'Servidor fora do ar', 'Firewall bloqueando', 'Configuracao de rede incorreta'],
ARRAY['Verifique conexao', 'Tente alternar WiFi/dados', 'Reinicie o roteador', 'Tente mais tarde'],
ARRAY['socket', 'rede', 'network', 'conexao']),

('java\.net\.SocketTimeoutException', 'java', 'SocketTimeoutException', 'medium',
'O servidor demorou muito para responder. Tempo esgotado.',
ARRAY['Internet lenta', 'Servidor sobrecarregado', 'Distancia do servidor', 'Muitos apps usando rede'],
ARRAY['Use conexao mais rapida', 'Feche outros apps', 'Tente em horario diferente', 'Pode ser problema do servidor'],
ARRAY['timeout', 'tempo', 'timeout', 'demora']),

('java\.net\.UnknownHostException', 'java', 'UnknownHostException', 'high',
'Nao foi possivel encontrar o endereco do servidor. Como ligar para numero inexistente.',
ARRAY['Sem conexao com internet', 'DNS falhou', 'Endereco incorreto', 'Servidor fora do ar'],
ARRAY['Verifique se esta conectado', 'Tente novamente', 'Verifique configuracoes de rede', 'Contate suporte se persistir'],
ARRAY['unknownhost', 'dns', 'servidor', 'host']),

('java\.sql\.SQLException', 'java', 'SQLException', 'high',
'Erro ao acessar o banco de dados do aplicativo.',
ARRAY['Dados corrompidos', 'Estrutura incompativel', 'Memoria insuficiente', 'Operacao invalida'],
ARRAY['Limpe dados do app', 'Reinstale o aplicativo', 'Libere espaco', 'Reporte ao desenvolvedor'],
ARRAY['sql', 'database', 'banco', 'dados']),

-- FLUTTER ERRORS
('FlutterJNI:\s*FlutterJNI\s+load', 'flutter', 'Flutter Init Error', 'high',
'O framework Flutter nao conseguiu inicializar corretamente.',
ARRAY['Versao do Android incompativel', 'Memoria insuficiente', 'APK corrompido', 'Conflito com outro app Flutter'],
ARRAY['Atualize o Android', 'Feche outros apps', 'Reinstale o aplicativo', 'Reporte se persistir'],
ARRAY['flutter', 'init', 'load', 'engine']),

('FlutterJNI:\s*GetDoubleArg.*failed', 'flutter', 'Flutter Argument Error', 'medium',
'Erro interno do framework Flutter ao processar argumentos.',
ARRAY['Bug no aplicativo', 'Dados em formato incorreto', 'Versao desatualizada do app'],
ARRAY['Atualize o aplicativo', 'Reinicie o app', 'Reporte ao desenvolvedor'],
ARRAY['flutter', 'argument', 'jni']),

('I/flutter:\s*Exception\s+caught', 'flutter', 'Flutter Exception', 'high',
'O framework Flutter capturou uma excecao no codigo do aplicativo.',
ARRAY['Bug no codigo Dart', 'Dados invalidos', 'Operacao nao suportada', 'Widget mal configurado'],
ARRAY['Reinicie o aplicativo', 'Atualize para versao mais recente', 'Reporte o erro', 'Limpe dados do app'],
ARRAY['flutter', 'exception', 'caught', 'dart']),

('NoSuchMethodError', 'flutter', 'Flutter NoSuchMethodError', 'high',
'O codigo Flutter tentou chamar um metodo que nao existe.',
ARRAY['Objeto nulo', 'Versao de API incompativel', 'Plugin faltando', 'Bug no codigo'],
ARRAY['Atualize o aplicativo', 'Reinstale o app', 'Verifique plugins instalados', 'Reporte ao desenvolvedor'],
ARRAY['nosuchmethod', 'flutter', 'method', 'metodo']),

('WidgetsFlutterBinding\.ensureInitialized', 'flutter', 'Flutter Binding Error', 'medium',
'O aplicativo Flutter nao inicializou os componentes corretamente.',
ARRAY['Inicializacao incorreta', 'Dependencia faltando', 'Versao incompativel'],
ARRAY['Reinstale o aplicativo', 'Atualize o aplicativo', 'Reinicie o dispositivo'],
ARRAY['binding', 'init', 'flutter']),

('RenderFlex\s+overflowed', 'flutter', 'Flutter Layout Overflow', 'low',
'Um componente nao coube no espaco disponivel na tela.',
ARRAY['Tela muito pequena', 'Texto muito longo', 'Layout responsivo mal configurado', 'Fonte grande demais'],
ARRAY['Nenhuma acao necessaria se nao travar', 'Reporte se afetar uso do app', 'Gire a tela se possivel'],
ARRAY['overflow', 'layout', 'renderflex', 'pixel']),

('setState.*called.*after.*dispose', 'flutter', 'Flutter State Error', 'medium',
'O codigo tentou atualizar uma tela que ja foi fechada.',
ARRAY['Operacao demorou e tela fechou', 'Bug no gerenciamento de estado', 'Async apos navegacao'],
ARRAY['Reinicie o aplicativo', 'Evite navegar durante carregamentos', 'Reporte ao desenvolvedor'],
ARRAY['setstate', 'dispose', 'state', 'estado']),

('D/FlutterLocationService', 'flutter', 'Flutter Location', 'low',
'Servico de localizacao do Flutter.',
ARRAY['Permissao de localizacao', 'GPS desativado', 'Servico em segundo plano'],
ARRAY['Ative GPS', 'Autorize localizacao', 'Nenhuma acao se app funciona'],
ARRAY['location', 'localizacao', 'gps', 'flutter']),

-- INSTALLATION ERRORS
('INSTALL_FAILED_INSUFFICIENT_STORAGE', 'install', 'Armazenamento Insuficiente', 'critical',
'Nao ha espaco suficiente para instalar o aplicativo.',
ARRAY['Armazenamento interno cheio', 'Cache acumulado', 'Muitos apps instalados', 'Arquivos grandes'],
ARRAY['Libere espaco excluindo arquivos', 'Desinstale apps nao usados', 'Limpe cache do sistema', 'Mova arquivos para nuvem'],
ARRAY['storage', 'espaco', 'install', 'insufficient']),

('INSTALL_FAILED_UPDATE_INCOMPATIBLE', 'install', 'Atualizacao Incompativel', 'high',
'A versao instalada nao pode ser atualizada diretamente.',
ARRAY['Assinatura diferente da versao anterior', 'Versao de teste vs producão', 'Pacote de fonte diferente', 'App modificado'],
ARRAY['Desinstale a versao anterior', 'Instale a versao nova', 'Use fonte oficial', 'Limpe dados antes de instalar'],
ARRAY['update', 'incompatible', 'assinatura']),

('INSTALL_PARSE_FAILED_NO_CERTIFICATES', 'install', 'APK Sem Certificado', 'high',
'O arquivo APK nao tem assinatura digital valida.',
ARRAY['APK corrompido no download', 'Versao de desenvolvimento', 'Fonte nao confiavel', 'Modificacao maliciosa'],
ARRAY['Baixe de fonte oficial', 'Reinstale da Play Store', 'Nao instale APKs desconhecidos', 'Verifique integridade'],
ARRAY['certificate', 'certificado', 'assinatura', 'parse']),

('INSTALL_FAILED_VERSION_DOWNGRADE', 'install', 'Versao Antiga', 'medium',
'Tentativa de instalar versao mais antiga que a atual.',
ARRAY['Versao mais nova ja instalada', 'Rollback nao permitido', 'Dependencias conflitantes'],
ARRAY['Desinstale versao atual primeiro', 'Use versao mais recente', 'Nao tente fazer downgrade'],
ARRAY['version', 'versao', 'downgrade', 'versao']),

('INSTALL_FAILED_MISSING_SHARED_LIBRARY', 'install', 'Biblioteca Faltando', 'high',
'O aplicativo precisa de uma biblioteca que nao existe no sistema.',
ARRAY['Servico Google Play nao instalado', 'API faltando no Android', 'Versao muito antiga do Android'],
ARRAY['Instale Google Play Services', 'Atualize o Android', 'Verifique requisitos do app', 'Use dispositivo compativel'],
ARRAY['library', 'biblioteca', 'shared', 'missing']),

('INSTALL_FAILED_CPU_ABI_INCOMPATIBLE', 'install', 'Arquitetura Incompativel', 'high',
'O aplicativo nao e compativel com o processador do seu dispositivo.',
ARRAY['APK para arquitetura diferente', 'Dispositivo ARM vs x86', 'Emulador incompativel', 'Build incorreto'],
ARRAY['Baixe versao correta para seu dispositivo', 'Contate desenvolvedor', 'Use Play Store que detecta automaticamente'],
ARRAY['cpu', 'abi', 'arch', 'arquitetura']),

('INSTALL_FAILED_TEST_ONLY', 'install', 'APK de Teste', 'medium',
'Este APK e apenas para testes e nao foi assinado para producão.',
ARRAY['Versao de desenvolvimento', 'APK nao finalizado', 'Configuracao de teste'],
ARRAY['Use versao de producão', 'Contate desenvolvedor para versao oficial', 'Nao recomendado para uso diario'],
ARRAY['test', 'teste', 'only', 'development']),

('INSTALL_FAILED_BLOCKED', 'install', 'Instalacao Bloqueada', 'high',
'A instalacao foi bloqueada por seguranca ou politica.',
ARRAY['Antivirus bloqueando', 'Protecao do sistema ativa', 'Fonte desconhecida bloqueada', 'Politica empresarial'],
ARRAY['Desative antivirus temporariamente', 'Autorize fontes desconhecidas', 'Use Play Store', 'Contate TI se dispositivo corporativo'],
ARRAY['blocked', 'bloqueado', 'security', 'seguranca']),

('INSTALL_FAILED_DELETED', 'install', 'Pacote Deletado', 'medium',
'O pacote foi removido antes da instalacao terminar.',
ARRAY['Instalacao cancelada', 'Processo interrompido', 'Memoria liberada durante instalacao'],
ARRAY['Tente instalar novamente', 'Nao cancele durante instalacao', 'Libere mais memoria antes'],
ARRAY['deleted', 'deletado', 'cancelado']),

-- NETWORK/BATTERY ERRORS
('NetworkOnMainThreadException', 'android', 'Rede na Thread Principal', 'high',
'O app tentou fazer operacao de rede de forma que travaria a interface.',
ARRAY['Bug no codigo do app', 'Conexao lenta', 'Processamento incorreto'],
ARRAY['Atualize o aplicativo', 'Reporte ao desenvolvedor', 'Este e erro de programacao'],
ARRAY['network', 'mainthread', 'thread', 'ui']),

('SocketException:\s*Connection\s+reset', 'java', 'Conexao Reiniciada', 'medium',
'A conexao foi interrompida pelo servidor ou rede.',
ARRAY['Servidor reiniciou conexao', 'Rede instavel', 'Timeout', 'Firewall interferiu'],
ARRAY['Verifique conexao', 'Tente novamente', 'Tente WiFi se usar dados', 'Contate suporte se persistir'],
ARRAY['connection', 'reset', 'conexao', 'internet']),

('SSLException|SSLHandshakeException', 'java', 'Erro SSL', 'high',
'Problema com certificado de seguranca da conexao.',
ARRAY['Certificado expirado', 'Relogio do celular incorreto', 'Man in the middle', 'Certificado invalido'],
ARRAY['Verifique data/hora do celular', 'Atualize o aplicativo', 'Nao use redes publicas', 'Contate suporte'],
ARRAY['ssl', 'certificate', 'certificado', 'seguranca']),

('DeadObjectException', 'android', 'Objeto Morto', 'high',
'O processo que o app tentava acessar foi encerrado.',
ARRAY['Servico em segundo plano morto', 'Otimizacao de bateria', 'Memoria baixa', 'Sistema matou processo'],
ARRAY['Reinicie o aplicativo', 'Desative otimizacao de bateria para o app', 'Reinicie o celular', 'Mantenha memoria livre'],
ARRAY['deadobject', 'processo', 'service']),

('TransactionTooLargeException', 'android', 'Transacao Grande Demais', 'medium',
'O app tentou transferir dados demais de uma vez.',
ARRAY['Lista muito grande', 'Imagem pesada demais', 'Cache acumulado', 'Limite Binder excedido'],
ARRAY['Processe menos dados por vez', 'Limpe cache do app', 'Use arquivos menores', 'Reinicie o app'],
ARRAY['transaction', 'large', 'grande', 'binder']),

('RemoteServiceException', 'android', 'Servico Remoto Falhou', 'high',
'Um servico externo que o app usa falhou.',
ARRAY['Servico de terceiros fora do ar', 'API key invalida', 'Versao de API descontinuada'],
ARRAY['Tente mais tarde', 'Verifique se ha atualizacoes', 'Reporte se persistir', 'Contate suporte'],
ARRAY['remote', 'service', 'api', 'terceiro']),

('W/.*:\s*Slow\s+operation', 'android', 'Operacao Lenta', 'low',
'O sistema detectou que uma operacao esta demorando muito.',
ARRAY['Processamento pesado', 'Dispositivo antigo', 'Muitos apps abertos', 'Bateria fraca'],
ARRAY['Feche outros apps', 'Reinicie o dispositivo', 'Aguarde terminar', 'Nenhuma acao se funcionar'],
ARRAY['slow', 'lento', 'performance', 'demora']),

('StrictMode.*policy\s+violation', 'android', 'Violacao de Politica', 'medium',
'O app violou boas praticas de desenvolvimento Android.',
ARRAY['Operacao de disco na thread principal', 'Operacao de rede na UI', 'Leitura lenta travando'],
ARRAY['Atualize o aplicativo', 'Reporte ao desenvolvedor', 'Este e bug de programacao', 'Reinstale o app'],
ARRAY['strictmode', 'policy', 'violation']),

-- PERMISSION ERRORS  
('SecurityException:\s*Permission\s+denied', 'android', 'Permissao Negada', 'high',
'O app tentou acessar algo sem a permissao necessaria.',
ARRAY['Usuario negou permissao', 'Permissao revogada manualmente', 'Bug no pedido de permissao'],
ARRAY['Va em Configuracoes > Apps > Permissoes', 'Autorize as permissoes solicitadas', 'Reinstale o app', 'Reinicie o app apos autorizar'],
ARRAY['permission', 'permissao', 'denied', 'negada']),

('SecurityException:\s*getLoaderManager.*not\s+available', 'android', 'Loader Indisponivel', 'medium',
'Componente antigo do Android nao disponivel.',
ARRAY['Versao incompativel do Android', 'API descontinuada', 'Bug de migracao'],
ARRAY['Atualize o aplicativo', 'Verifique compatibilidade', 'Reporte ao desenvolvedor'],
ARRAY['loader', 'manager', 'fragment']),

-- DATABASE ERRORS
('SQLiteException:\s*no\s+such\s+table', 'android', 'Tabela Nao Encontrada', 'high',
'O banco de dados do app esta corrompido ou incompleto.',
ARRAY['Banco de dados corrompido', 'Atualizacao falhou', 'Instalacao incompleta', 'Dados deletados incorretamente'],
ARRAY['Limpe dados do aplicativo', 'Reinstale o aplicativo', 'Reporte se persistir apos reinstalar'],
ARRAY['sqlite', 'table', 'database', 'banco']),

('SQLiteException:\s*database\s+is\s+locked', 'android', 'Banco Travado', 'medium',
'O banco de dados esta bloqueado por outro processo.',
ARRAY['Outro app acessando mesmo banco', 'Processo travado', 'Operacao anterior nao terminou', 'Sync em andamento'],
ARRAY['Feche outros processos', 'Reinicie o aplicativo', 'Aguarde alguns segundos', 'Reinicie o celular'],
ARRAY['sqlite', 'locked', 'travado', 'database']),

('SQLiteConstraintException', 'android', 'Violacao de Restricao', 'medium',
'Tentativa de inserir dados que violam regras do banco.',
ARRAY['Dado duplicado', 'Campo obrigatorio vazio', 'Chave estrangeira invalida', 'Valor fora do permitido'],
ARRAY['Verifique dados inseridos', 'Nao repita dados unicos', 'Preencha campos obrigatorios', 'Reporte se dados corretos'],
ARRAY['constraint', 'restricao', 'unique', 'violation']);

-- Add a helpful function for text search matching
CREATE OR REPLACE FUNCTION match_error_patterns(search_text TEXT)
RETURNS TABLE (
  id UUID,
  pattern TEXT,
  category TEXT,
  error_name TEXT,
  severity TEXT,
  what_it_means TEXT,
  common_causes TEXT[],
  possible_solutions TEXT[],
  match_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ep.id,
    ep.pattern,
    ep.category,
    ep.error_name,
    ep.severity,
    ep.what_it_means,
    ep.common_causes,
    ep.possible_solutions,
    CASE 
      WHEN search_text ~* ep.pattern THEN 100
      ELSE (
        SELECT COALESCE(SUM(CASE WHEN search_text ILIKE '%' || kw || '%' THEN 10 ELSE 0 END), 0)
        FROM unnest(ep.keywords) AS kw
      )
    END as match_score
  FROM error_patterns ep
  WHERE 
    search_text ~* ep.pattern
    OR EXISTS (
      SELECT 1 FROM unnest(ep.keywords) AS kw 
      WHERE search_text ILIKE '%' || kw || '%'
    )
  ORDER BY match_score DESC, 
    CASE ep.severity 
      WHEN 'critical' THEN 1 
      WHEN 'high' THEN 2 
      WHEN 'medium' THEN 3 
      WHEN 'low' THEN 4 
    END
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;
