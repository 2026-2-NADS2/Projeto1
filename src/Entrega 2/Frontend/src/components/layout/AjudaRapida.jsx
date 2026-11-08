import { Link } from 'react-router-dom';
import Modal from '../Modal.jsx';
import { GrupoFaq } from '../Faq.jsx';
import { GRUPOS_FAQ } from '../../data/perguntasFrequentes.js';
import { ROTAS } from '../../utils/rotas.js';
import { PERFIS } from '../../utils/formatadores.js';

/* Botão "?" do topo: perguntas frequentes do perfil logado, sem sair da tela */
export default function AjudaRapida({ perfil, aoFechar }) {
  const grupos = GRUPOS_FAQ.filter((g) => g.perfis.includes(perfil));
  return (
    <Modal
      titulo="Perguntas frequentes"
      descricao={`Dúvidas comuns de quem usa a 4U como ${PERFIS[perfil].toLowerCase()}.`}
      aoFechar={aoFechar}
      rodape={(
        <>
          <Link className="btn btn--fantasma" to={ROTAS.contato} onClick={aoFechar}>Falar com a escola</Link>
          <button type="button" className="btn btn--primario" onClick={aoFechar}>Fechar</button>
        </>
      )}
    >
      <div className="ajuda-rapida">
        {grupos.map((g) => <GrupoFaq key={g.id} grupo={g} />)}
      </div>
    </Modal>
  );
}
