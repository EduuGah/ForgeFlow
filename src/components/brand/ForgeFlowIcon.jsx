import symbolMask from '../../assets/brand/forgeflow-symbol-mask.png'
import appIconWhite from '../../assets/brand/forgeflow-app-icon-white.png'

function toSizeValue(size) {
  if (typeof size === 'number') return `${size}px`
  return size || '56px'
}

/**
 * Ícone interno do ForgeFlow.
 *
 * - variant="app": mostra o bloco escuro premium com o símbolo na cor atual do tema.
 * - variant="symbol": mostra apenas o símbolo, usando currentColor/--ff-accent.
 * - variant="launcher": mostra o PNG branco fixo, útil para previews/exportações.
 */
function ForgeFlowIcon({
  variant = 'app',
  size = 56,
  className = '',
  title = 'ForgeFlow',
  decorative = false,
  style,
}) {
  const dimension = toSizeValue(size)
  const accessibleProps = decorative
    ? { 'aria-hidden': true }
    : { role: 'img', 'aria-label': title }

  if (variant === 'launcher') {
    return (
      <img
        src={appIconWhite}
        alt={decorative ? '' : title}
        className={['ff-brand-launcher-icon', className].filter(Boolean).join(' ')}
        style={{ width: dimension, height: dimension, ...style }}
      />
    )
  }

  if (variant === 'symbol') {
    return (
      <span
        {...accessibleProps}
        className={['ff-brand-symbol', className].filter(Boolean).join(' ')}
        style={{
          width: dimension,
          height: dimension,
          '--ff-brand-symbol-mask': `url(${symbolMask})`,
          ...style,
        }}
      />
    )
  }

  return (
    <span
      {...accessibleProps}
      className={['ff-brand-app-icon', className].filter(Boolean).join(' ')}
      style={{ width: dimension, height: dimension, ...style }}
    >
      <span
        className="ff-brand-app-icon__symbol"
        style={{ '--ff-brand-symbol-mask': `url(${symbolMask})` }}
      />
    </span>
  )
}

export default ForgeFlowIcon
