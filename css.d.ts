// TypeScript 6 type-checks side-effect imports (noUncheckedSideEffectImports),
// so `import "./global.css"` in App.tsx needs a module declaration.
// NativeWind's generated nativewind-env.d.ts doesn't provide one.
declare module "*.css";
