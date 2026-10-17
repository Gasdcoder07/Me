// Image files are imported as modules: Metro resolves each one to an asset id that <Image> accepts.
declare module '*.png' {
  const source: number;
  export default source;
}
