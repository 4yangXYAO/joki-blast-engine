declare module 'sql.js' {
  function initSqlJs(opts?: any): Promise<any>;
  const _default: { default?: typeof initSqlJs } & typeof initSqlJs;
  export default _default;
  export { initSqlJs };
}
