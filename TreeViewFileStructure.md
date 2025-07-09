treeview-widget/
├── src/
│   ├── TreeView.tsx                 # Main widget component
│   ├── TreeView.xml                 # Widget configuration
│   ├── TreeView.editorConfig.ts     # Studio Pro configuration
│   ├── TreeView.editorPreview.tsx   # Studio Pro preview
│   ├── components/
│   │   ├── Tree/
│   │   │   ├── Tree.tsx             # Main tree component
│   │   │   ├── TreeNode.tsx         # Individual node component
│   │   │   ├── TreeNodeContent.tsx  # Node content wrapper
│   │   │   ├── TreeSearch.tsx       # Search component
│   │   │   ├── TreeBreadcrumb.tsx   # Breadcrumb navigation
│   │   │   └── TreeVirtualizer.tsx  # Virtual scrolling
│   │   ├── Icons/
│   │   │   ├── ChevronIcon.tsx
│   │   │   ├── EyeIcon.tsx
│   │   │   └── SearchIcon.tsx
│   │   └── ContextMenu/
│   │       └── TreeContextMenu.tsx
│   ├── hooks/
│   │   ├── useTreeData.ts          # Data processing hook
│   │   ├── useVirtualizer.ts       # Virtual scrolling hook
│   │   ├── useTreeSearch.ts        # Search functionality
│   │   ├── useTreeSelection.ts     # Selection management
│   │   ├── useTreeKeyboard.ts      # Keyboard navigation
│   │   └── useTreeState.ts         # Tree state management
│   ├── utils/
│   │   ├── treeBuilder.ts          # Tree structure builder
│   │   ├── searchUtils.ts          # Search algorithms
│   │   ├── visibilityUtils.ts      # Visibility calculations
│   │   ├── selectionUtils.ts       # Selection helpers
│   │   └── performanceUtils.ts     # Performance optimizations
│   ├── types/
│   │   └── TreeTypes.ts            # TypeScript definitions
│   └── styles/
│       └── TreeView.module.scss     # Styles
├── typings/
│   └── TreeViewProps.d.ts          # Generated props
└── package.xml                      # Widget package configuration