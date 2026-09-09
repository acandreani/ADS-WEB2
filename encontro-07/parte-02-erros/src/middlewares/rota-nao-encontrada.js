export function rotaNaoEncontrada(req, res) {
  return res.status(404).json({
    codigo: 'ROTA_NAO_ENCONTRADA',
    mensagem: 'Rota não encontrada',
    requestId: req.requestId
  });
}
