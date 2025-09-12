# TypeScript Coding Rules v3

## Type Safety Rules

- **No `any` or `as any`**: Do not use `any` or type assertions with `as any` unless the data is truly runtime in nature and cannot be statically typed. When dealing with runtime data, validate it using Yup schemas.
- **Explicit function signatures**: All functions must have well-defined parameter types and return types.
- **Use `type` over `interface`**: Use `type` for data shapes and `interface` only when defining actual contracts/services that may be implemented.

## Code Quality Rules

- **No code repetition**: Repeated code must be extracted into reusable functions.
- **Descriptive naming**: Use clear, descriptive names for variables, functions, and types.
- **Prefer `const` assertions**: Use `as const` for literal types instead of manual type definitions where appropriate.
- **No implicit returns**: Always explicitly return values from functions.
- **Use utility types**: Leverage TypeScript utility types (`Pick`, `Omit`, `Partial`, etc.) instead of manual type definitions.

## Function Design Rules

- **Single responsibility**: Functions should handle single actions and be testable in isolation.
- **No long functions**: Keep functions short and focused. Break complex logic into smaller, composable functions.
- **Fail early**: Always validate inputs and fail early in functions with clear error messages.

## Project Structure Rules

- **Shared types separation**: Use separate folders/files for shared types that are used across multiple modules.
- **Folder organization**: Structure code using logical folders (e.g., `utils/`, `shared/`, `types/`, `services/`).
- **Layer separation**: Keep the presentation layer separate from the functional/business logic layer.
- **Domain grouping**: Group related functionality together while maintaining clear boundaries.

## TypeScript Configuration Rules (tsconfig.json)

### Base Configuration (Required for All Projects)

```json
{
  "compilerOptions": {
    "esModuleInterop": true,
    "skipLibCheck": true,
    "target": "es2022",
    "allowJs": true,
    "resolveJsonModule": true,
    "moduleDetection": "force",
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  }
}
```

- **esModuleInterop**: Enables better CommonJS/ES Module interoperability
- **skipLibCheck**: Skip type checking of declaration files for performance
- **target**: Use `es2022` for stability over `esnext`
- **allowJs**: Allow importing JavaScript files
- **resolveJsonModule**: Allow importing JSON files
- **moduleDetection**: Force all files to be treated as modules
- **isolatedModules**: Prevent unsafe features when treating modules as isolated files
- **verbatimModuleSyntax**: Enforce explicit `import type` and `export type` usage

### Strictness Configuration (Required for All Projects)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

- **strict**: Enable all strict type checking options
- **noUncheckedIndexedAccess**: Require index access to be checked before use
- **noImplicitOverride**: Require explicit `override` keyword in classes

### For Applications (Transpiling with TypeScript)

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "outDir": "dist",
    "sourceMap": true
  }
}
```

- **module**: Use `NodeNext` for Node.js applications
- **outDir**: Output compiled files to `dist` directory
- **sourceMap**: Generate source maps for debugging

### For Libraries

```json
{
  "compilerOptions": {
    "declaration": true
  }
}
```

- **declaration**: Generate `.d.ts` files for library consumers

### For Libraries in Monorepos

```json
{
  "compilerOptions": {
    "declaration": true,
    "composite": true,
    "sourceMap": true,
    "declarationMap": true
  }
}
```

- **composite**: Enable TypeScript project references
- **declarationMap**: Generate declaration source maps

### For Bundled Applications (Not Transpiling with TypeScript)

```json
{
  "compilerOptions": {
    "module": "preserve",
    "noEmit": true
  }
}
```

- **module**: Use `preserve` to match bundler behavior
- **noEmit**: Don't generate JavaScript files

### Environment-Specific Configuration

**For DOM Applications:**

```json
{
  "compilerOptions": {
    "lib": ["es2022", "dom", "dom.iterable"]
  }
}
```

**For Node.js Applications:**

```json
{
  "compilerOptions": {
    "lib": ["es2022"]
  }
}
```

## Additional Rules

- **Strict null checks**: Handle null/undefined cases explicitly.
- **Error handling**: Functions that can fail should return Result types or throw typed errors.
