export default function ConfirmModal({ game, deleting, onConfirm, onCancel }) {
  function handleKeyDown(e) {
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Confirmar eliminación de partida"
      onKeyDown={handleKeyDown}
      onClick={onCancel}
    >
      <div class="card modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>¿Eliminar esta partida?</h2>
        <span class="game-date">{game.date}</span>
        <div class="game-players">
          {game.players.map((p) => (
            <span key={`${game.id}-${p.name}`} class="chip">
              {p.name}: {p.points}
            </span>
          ))}
        </div>
        <div class="actions">
          <button onClick={onCancel} disabled={deleting} autoFocus>
            Cancelar
          </button>
          <button class="game-delete" onClick={onConfirm} disabled={deleting}>
            {deleting ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}
