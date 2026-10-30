import { useCallback, useEffect, useState } from 'react';

export default function useApi(buscar, dependencias = []) {
  const chave = JSON.stringify(dependencias);
  const [estado, setEstado] = useState({ chave: null, dados: null, erro: null });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    setEstado({ chave: null, dados: null, erro: null });
    buscar()
      .then((dados) => { if (ativo) setEstado({ chave, dados, erro: null }); })
      .catch((erro) => { if (ativo) setEstado({ chave, dados: null, erro }); });
    return () => { ativo = false; };
  }, [tentativa, chave]);

  const recarregar = useCallback(() => setTentativa((t) => t + 1), []);
  const atual = estado.chave === chave;
  return {
    dados: atual ? estado.dados : null,
    erro: atual ? estado.erro : null,
    carregando: !atual,
    recarregar
  };
}
