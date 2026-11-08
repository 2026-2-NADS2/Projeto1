/* Perguntas frequentes. "perfis" diz em qual ajuda do topo o grupo aparece; a página pública /ajuda mostra os grupos com publico: true */
const PERGUNTAS_FREQUENTES = [
  {
    titulo: 'Acesso à plataforma',
    publico: true,
    perfis: ['ADMINISTRADOR', 'PROFESSOR', 'RESPONSAVEL'],
    perguntas: [
      {
        pergunta: 'Como faço meu primeiro acesso?',
        resposta: 'A escola faz o seu cadastro e libera o acesso. Você recebe um e-mail com o botão "Criar minha senha", que vale por 3 dias. Não existe cadastro por conta própria: só a escola cadastra professores e responsáveis.'
      },
      {
        pergunta: 'Esqueci minha senha. O que faço?',
        resposta: 'Na tela de entrada, clique em "Esqueci minha senha" e informe o seu e-mail. Chega um link para criar uma senha nova, que vale por 30 minutos e só pode ser usado uma vez. Se não chegar, confira o spam ou fale com a secretaria.'
      },
      {
        pergunta: 'Por que precisei entrar de novo?',
        resposta: 'Por segurança, a sessão é encerrada depois de 30 minutos sem atividade. Basta entrar novamente com seu e-mail e senha.'
      }
    ]
  },
  {
    titulo: 'Para famílias',
    publico: true,
    perfis: ['RESPONSAVEL'],
    perguntas: [
      {
        pergunta: 'Quando posso ver o acompanhamento do bimestre?',
        resposta: 'Assim que a escola revisar e publicar. Os registros passam pela coordenação antes de chegar à família, por isso podem aparecer em dias diferentes para cada disciplina. O sino no topo avisa quando há relatório novo.'
      },
      {
        pergunta: 'Tenho mais de um filho na escola. Preciso de outra conta?',
        resposta: 'Não. Um mesmo responsável pode estar vinculado a vários alunos. Em Relatórios, escolha o aluno e o bimestre que deseja consultar.'
      },
      {
        pergunta: 'Como baixo o relatório em PDF?',
        resposta: 'Em Relatórios, clique em "Gerar PDF" e, na janela de impressão, escolha "Salvar como PDF". O PDF traz as mesmas informações exibidas na tela.'
      },
      {
        pergunta: 'O que significa "dar ciência"?',
        resposta: 'É confirmar que você leu o relatório. Junto com a ciência, você pode enviar uma observação, que fica visível para o professor e para a coordenação.'
      }
    ]
  },
  {
    titulo: 'Para professores',
    publico: true,
    perfis: ['PROFESSOR'],
    perguntas: [
      {
        pergunta: 'Como registro o acompanhamento de um aluno?',
        resposta: 'Em Acompanhamentos, escolha a turma e o aluno, informe a média do bimestre, as tags e uma descrição do desenvolvimento. Salve como rascunho ou clique em "Enviar para revisão" quando estiver pronto.'
      },
      {
        pergunta: 'Meu registro foi devolvido. E agora?',
        resposta: 'Ele aparece em Retornos e no sino do topo, com o motivo escrito pela coordenação. Clique em "Corrigir", faça os ajustes e envie novamente.'
      },
      {
        pergunta: 'Até quando posso registrar?',
        resposta: 'Enquanto a digitação do bimestre estiver aberta. As datas são definidas pela coordenação, e o sino avisa quando faltam 7 dias ou menos para encerrar.'
      },
      {
        pergunta: 'Onde vejo o que as famílias responderam?',
        resposta: 'Em Retornos, na parte de observações das famílias. Quando uma família deixa uma observação nova, ela também aparece no sino.'
      }
    ]
  },
  {
    titulo: 'Para a administração',
    publico: false,
    perfis: ['ADMINISTRADOR'],
    perguntas: [
      {
        pergunta: 'Como libero o acesso de um professor ou responsável?',
        resposta: 'Em Cadastros, abra a pessoa em "Gerenciar" e clique em "Liberar acesso". Ela recebe um e-mail para criar a senha. Se o e-mail não estiver configurado, o link aparece na tela para você copiar.'
      },
      {
        pergunta: 'Qual a diferença entre desativar e excluir?',
        resposta: 'Desativar tira o acesso na hora e pode ser desfeito com "Reativar acesso". Excluir apaga o cadastro e só aparece para quem não tem histórico, como um cadastro feito por engano.'
      },
      {
        pergunta: 'Como reviso o que os professores enviaram?',
        resposta: 'Em Acompanhamentos, na aba "Aguardando revisão". Abra o registro e escolha "Ajustar texto", "Devolver" (com o motivo) ou "Publicar". Só os publicados chegam às famílias.'
      },
      {
        pergunta: 'Como abro ou encerro a digitação do bimestre?',
        resposta: 'Em Bimestres, use "Editar período", "Encerrar agora" ou "Reabrir por 7 dias". Fora do período, os professores só consultam.'
      },
      {
        pergunta: 'Como gero a planilha do bimestre?',
        resposta: 'Em Relatórios, escolha o bimestre e clique em "Exportar para Excel". O arquivo .csv abre direto no Excel, com todos os registros publicados.'
      }
    ]
  },
  {
    titulo: 'Privacidade',
    publico: true,
    perfis: ['ADMINISTRADOR', 'PROFESSOR', 'RESPONSAVEL'],
    perguntas: [
      {
        pergunta: 'Quem pode ver os dados do aluno?',
        resposta: 'Apenas os responsáveis autorizados, os professores das disciplinas do aluno e a equipe escolar. Os dados são tratados conforme a Lei Geral de Proteção de Dados (LGPD).'
      }
    ]
  }
];

/* Ids fixos para ligar cada pergunta à sua resposta (aria-controls) */
export const GRUPOS_FAQ = PERGUNTAS_FREQUENTES.map((g, gi) => ({
  ...g,
  id: 'faq-grupo-' + gi,
  perguntas: g.perguntas.map((p, pi) => ({ ...p, id: `resposta-${gi}-${pi}` }))
}));

export default PERGUNTAS_FREQUENTES;
