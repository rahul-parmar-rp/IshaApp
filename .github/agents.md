### Code Generation Agent
- **Purpose**: Generate React Native components and utilities
- **Scope**: TypeScript/JavaScript, React Native components, utility functions
- **Guidelines**: 
  - Minimal styling approach
  - Android-first development
  - Clean, readable code without excessive comments

## Development Standards

### Naming Conventions
- **PascalCase**: Component names, interfaces, type aliases
- **camelCase**: Variables, functions, methods
- **underscore prefix**: Private class members
- **ALL_CAPS**: Constants

### Code Style
- Minimal styling approach
- Android-first development
- TypeScript for type safety
- Functional components with hooks

### File Organization
- Components in `/src/components/`
- Screens in `/src/screens/`
- Utilities in `/src/utils/`
- Types in `/src/types/`

## Agent Instructions

### When generating React Native code:
1. Use TypeScript
2. Prefer functional components with hooks
3. Keep styling minimal and clean
4. Ensure Android compatibility
5. Follow the established naming conventions
6. Add proper type definitions

### When modifying existing code:
1. Maintain consistency with existing patterns
3. Preserve functionality while improving structure


### When adding new features:
1. Follow the established project structure
2. Add appropriate TypeScript types
3. Include basic error handling
4. Consider performance implications
5. Maintain the minimal styling approach
