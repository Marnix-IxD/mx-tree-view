import { ObjectItem, ListAttributeValue, ListReferenceValue, ListReferenceSetValue, ListActionValue, ActionValue, EditableValue } from "mendix";

export interface TreeNode {
    id: string;
    parentId: string | null;
    objectItem: ObjectItem;
    children: TreeNode[];
    level: number;
    path: string[];
    isLeaf: boolean;
    isVisible: boolean;
    isExpanded: boolean;
    structureId?: string;
    sortValue?: any;
}

export interface TreeNodeMap {
    [key: string]: TreeNode;
}

export type ParentRelationType = "attribute" | "association" | "structureId";
export type SearchMode = "client" | "server" | "hybrid";
export type SelectionMode = "none" | "single" | "multiple";
export type ExpandMode = "single" | "multiple";
export type SelectionOutputType = "guids" | "attributes" | "structureIds";

export interface TreeState {
    expandedNodes: Set<string>;
    selectedNodes: Set<string>;
    visibleNodes: Set<string>;
    focusedNodeId: string | null;
    searchQuery: string;
    searchResults: Set<string>;
}

export interface TreeAction {
    type: TreeActionType;
    payload: any;
    timestamp: number;
}

export type TreeActionType = 
    | "TOGGLE_EXPANDED"
    | "TOGGLE_VISIBILITY"
    | "SELECT_NODE"
    | "CLEAR_SELECTION"
    | "SET_SEARCH_QUERY"
    | "SET_SEARCH_RESULTS"
    | "EXPAND_ALL"
    | "COLLAPSE_ALL"
    | "EXPAND_TO_LEVEL";

export interface SearchResult {
    nodeId: string;
    matches: SearchMatch[];
}

export interface SearchMatch {
    attribute: string;
    value: string;
    matchedText: string;
    startIndex: number;
    endIndex: number;
}

export interface TreeDataHookProps {
    datasource: any;
    nodeIdAttribute: ListAttributeValue<string>;
    parentRelationType: ParentRelationType;
    parentIdAttribute?: ListAttributeValue<string>;
    parentAssociation?: ListReferenceValue | ListReferenceSetValue;
    structureIdAttribute?: ListAttributeValue<string>;
    visibilityAttribute?: ListAttributeValue<boolean>;
    expandedAttribute?: ListAttributeValue<boolean>;
    sortAttribute?: ListAttributeValue<any>;
    sortOrder: "asc" | "desc";
    defaultExpandLevel: number;
    lazyLoadChildren: boolean;
    lazyLoadAction?: ListActionValue;
}

export interface TreeStateHookProps {
    nodes: TreeNode[];
    nodeMap: Map<string, TreeNode>;
    expandMode: ExpandMode;
    enableVisibilityToggle: boolean;
    enableUndoRedo: boolean;
    visibilityAttribute?: ListAttributeValue<boolean>;
    expandedAttribute?: ListAttributeValue<boolean>;
    onVisibilityChange?: ActionValue;
}

export interface TreeSearchHookProps {
    nodes: TreeNode[];
    nodeMap: Map<string, TreeNode>;
    searchAttributes?: ListAttributeValue<any>[];
    searchMode: SearchMode;
    serverSearchAction?: ActionValue;
    searchDebounce: number;
    expandedNodes: Set<string>;
    toggleExpanded: (nodeId: string) => void;
}

export interface TreeSelectionHookProps {
    nodes: TreeNode[];
    nodeMap: Map<string, TreeNode>;
    selectionMode: SelectionMode;
    enableMultiSelect: boolean;
    selectionOutputType: SelectionOutputType;
    selectionOutputAttribute?: EditableValue<string>;
    onSelectionChange?: ActionValue;
}

export interface TreeKeyboardHookProps {
    containerRef: React.RefObject<HTMLDivElement>;
    nodes: TreeNode[];
    nodeMap: Map<string, TreeNode>;
    expandedNodes: Set<string>;
    selectedNodes: Set<string>;
    focusedNodeId: string | null;
    setFocusedNodeId: (nodeId: string | null) => void;
    toggleExpanded: (nodeId: string) => void;
    toggleSelection: (nodeId: string) => void;
    selectNode: (nodeId: string) => void;
    clearSelection: () => void;
    enabled: boolean;
}

export interface VirtualizerItem {
    index: number;
    start: number;
    size: number;
    node: TreeNode;
}

export interface VirtualizerState {
    scrollTop: number;
    containerHeight: number;
    virtualItems: VirtualizerItem[];
    totalSize: number;
    startIndex: number;
    endIndex: number;
}

export interface ContextMenuAction {
    label: string;
    icon?: string;
    action: () => void;
    disabled?: boolean;
    separator?: boolean;
}