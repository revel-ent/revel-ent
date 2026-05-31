function isFlagEnabled(raw: string | undefined): boolean {
  return (raw || '').trim().toLowerCase() === 'true';
}

function isVercelPreview(): boolean {
  return process.env.VERCEL_ENV === 'preview';
}

export function isLocalDevelopmentEnvironment(): boolean {
  return process.env.NODE_ENV === 'development' && !process.env.VERCEL;
}

export function isDemoAuthEnabled(): boolean {
  if (isFlagEnabled(process.env.PORTAL_ENABLE_DEMO_AUTH)) {
    return true;
  }

  if (process.env.NODE_ENV === 'production' || isVercelPreview()) {
    return false;
  }

  return true;
}

export function isDevRoleSwitchEnabled(): boolean {
  return isLocalDevelopmentEnvironment();
}
