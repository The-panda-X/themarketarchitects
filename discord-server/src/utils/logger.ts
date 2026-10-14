const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function timestamp(): string {
  return new Date().toISOString().replace('T', ' ').split('.')[0];
}

export const logger = {
  info(msg: string) {
    console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.blue}INFO${colors.reset}  ${msg}`);
  },
  success(msg: string) {
    console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.green}OK${colors.reset}    ${msg}`);
  },
  warn(msg: string) {
    console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.yellow}WARN${colors.reset}  ${msg}`);
  },
  error(msg: string, err?: unknown) {
    console.error(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.red}ERROR${colors.reset} ${msg}`);
    if (err instanceof Error) console.error(`  ${colors.red}${err.message}${colors.reset}`);
  },
  event(msg: string) {
    console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.magenta}EVENT${colors.reset} ${msg}`);
  },
  mod(msg: string) {
    console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.cyan}MOD${colors.reset}   ${msg}`);
  },
};
