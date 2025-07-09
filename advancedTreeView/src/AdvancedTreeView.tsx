import { ReactElement, createElement, useRef, useCallback, useMemo, useState, useEffect, Fragment } from "react";
import { AdvancedTreeViewContainerProps } from "../typings/AdvancedTreeViewProps";
import { Tree } from "./components/Tree/Tree";
import { TreeSearch } from "./components/Tree/TreeSearch";
import { TreeBreadcrumb } from "./components/Tree/TreeBreadcrumb";
import { TreeContextMenu } from "./components/ContextMenu/TreeContextMenu";
import { useTreeData } from "./hooks/useTreeData";
import { useTreeState } from "./hooks/useTreeState";
import { useTreeSearch } from "./hooks/useTreeSearch";
import { useTreeSelection } from "./hooks/useTreeSelection";
import { useTreeKeyboard } from "./hooks/useTreeKeyboard";
import { TreeNode, ContextMenuAction } from "./types/TreeTypes";
import "./ui/AdvancedTreeView.css";

export function TreeView(props: AdvancedTreeViewContainerProps): ReactElement {
    const containerRef = useRef<HTMLDivElement>(null);
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        node: TreeNode | null;
    } | null>(null);

    // Initialize tree data
    const {
        nodes,
        nodeMap,
        rootNodes,
        isLoading,
        loadChildren,
        refreshNodes,
        getDescendantIds,
        getAncestorIds
    } = useTreeData({
        datasource: props.datasource,
        nodeIdAttribute: props.nodeIdAttribute,
        parentRelationType: props.parentRelationType,
        parentIdAttribute: props.parentIdAttribute,
        parentAssociation: props.parentAssociation,
        structureIdAttribute: props.structureIdAttribute,
        visibilityAttribute: props.visibilityAttribute,
        expandedAttribute: props.expandedAttribute,
        sortAttribute: props.sortAttribute,
        sortOrder: props.sortOrder,
        defaultExpandLevel: props.defaultExpandLevel,
        lazyLoadChildren: props.lazyLoadChildren,
        lazyLoadAction: props.lazyLoadAction
    });

    // Initialize tree state
    const {
        expandedNodes,
        visibleNodes,
        toggleExpanded,
        toggleVisibility,
        expandAll,
        collapseAll,
        expandToLevel,
        undoAction,
        redoAction,
        canUndo,
        canRedo
    } = useTreeState({
        nodes,
        nodeMap,
        expandMode: props.expandMode,
        enableVisibilityToggle: props.enableVisibilityToggle,
        enableUndoRedo: props.enableUndoRedo,
        visibilityAttribute: props.visibilityAttribute,
        expandedAttribute: props.expandedAttribute,
        onVisibilityChange: props.onVisibilityChange
    });

    // Initialize search
    const {
        searchQuery,
        setSearchQuery,
        searchResults,
        highlightedNodes,
        isSearching,
        clearSearch
    } = useTreeSearch({
        nodes,
        nodeMap,
        searchAttributes: props.searchAttributes,
        searchMode: props.searchMode,
        serverSearchAction: props.serverSearchAction,
        searchDebounce: props.searchDebounce,
        expandedNodes,
        toggleExpanded
    });

    // Initialize selection
    const {
        selectedNodes,
        focusedNodeId,
        setFocusedNodeId,
        toggleSelection,
        selectNode,
        clearSelection,
        selectAll,
        selectRange
    } = useTreeSelection({
        nodes,
        nodeMap,
        selectionMode: props.selectionMode,
        enableMultiSelect: props.enableMultiSelect,
        selectionOutputType: props.selectionOutputType,
        selectionOutputAttribute: props.selectionOutputAttribute,
        onSelectionChange: props.onSelectionChange
    });

    // Initialize keyboard navigation
    useTreeKeyboard({
        containerRef,
        nodes,
        nodeMap,
        expandedNodes,
        selectedNodes,
        focusedNodeId,
        setFocusedNodeId,
        toggleExpanded,
        toggleSelection,
        selectNode,
        clearSelection,
        enabled: props.enableKeyboardNavigation
    });

    // Handle node click
    const handleNodeClick = useCallback((node: TreeNode) => {
        if (props.selectionMode !== "none") {
            selectNode(node.id);
        }

        if (props.onNodeClick && props.onNodeClick.canExecute) {
            props.onNodeClick.execute();
        }

        // Lazy load children if needed
        if (props.lazyLoadChildren && !node.isLeaf && node.children.length === 0) {
            loadChildren(node.id);
        }
    }, [props, selectNode, loadChildren]);

    // Handle node hover
    const handleNodeHover = useCallback((node: TreeNode) => {
        if (props.onNodeHover && props.onNodeHover.canExecute) {
            props.onNodeHover.execute();
        }
    }, [props.onNodeHover]);

    // Handle context menu
    const handleContextMenu = useCallback((e: React.MouseEvent, node: TreeNode) => {
        e.preventDefault();
        e.stopPropagation();

        if (props.contextMenuActions && props.contextMenuActions.length > 0) {
            setContextMenu({ x: e.clientX, y: e.clientY, node });
        }
    }, [props.contextMenuActions]);

    // Close context menu
    const handleCloseContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    // Get context menu actions
    const getContextMenuActions = useCallback((): ContextMenuAction[] => {
        if (!contextMenu?.node || !props.contextMenuActions) {
            return [];
        }

        return props.contextMenuActions.map(item => ({
            label: item.label.value || "Action",
            action: () => {
                if (item.action && item.action.canExecute) {
                    item.action.execute();
                }
                handleCloseContextMenu();
            }
        }));
    }, [contextMenu, props.contextMenuActions, handleCloseContextMenu]);

    // Get breadcrumb path
    const getBreadcrumbPath = useCallback((): TreeNode[] => {
        if (!focusedNodeId) return [];

        const path: TreeNode[] = [];
        let current = nodeMap.get(focusedNodeId);

        while (current) {
            path.unshift(current);
            current = current.parentId ? nodeMap.get(current.parentId) : null;
        }

        return path;
    }, [focusedNodeId, nodeMap]);

    // Handle breadcrumb click
    const handleBreadcrumbClick = useCallback((node: TreeNode) => {
        setFocusedNodeId(node.id);
        selectNode(node.id);
    }, [setFocusedNodeId, selectNode]);

    // Performance metrics
    const renderMetrics = useMemo(() => {
        if (!props.debugMode) return null;

        const totalNodes = nodes.length;
        const expandedCount = expandedNodes.size;
        const selectedCount = selectedNodes.size;
        const visibleCount = Array.from(expandedNodes).filter(id => {
            const node = nodeMap.get(id);
            if (!node) return false;
            const ancestors = getAncestorIds(id);
            return ancestors.every(ancestorId => expandedNodes.has(ancestorId));
        }).length;

        return {
            totalNodes,
            expandedCount,
            selectedCount,
            visibleCount
        };
    }, [props.debugMode, nodes, expandedNodes, selectedNodes, nodeMap, getAncestorIds]);

    return (
        <div className="tree-view-widget" ref={containerRef}>
            {props.enableSearch && (
                <TreeSearch
                    value={searchQuery}
                    onChange={setSearchQuery}
                    isSearching={isSearching}
                    resultCount={searchResults.size}
                    placeholder="Search..."
                    searchIcon={props.searchIcon}
                />
            )}

            {props.enableBreadcrumb && focusedNodeId && (
                <TreeBreadcrumb
                    path={getBreadcrumbPath()}
                    onClick={handleBreadcrumbClick}
                    nodeLabelAttribute={props.nodeLabelAttribute}
                />
            )}

            <div className="tree-view-toolbar">
                <button onClick={expandAll} className="tree-view-button">
                    Expand All
                </button>
                <button onClick={collapseAll} className="tree-view-button">
                    Collapse All
                </button>
                {props.enableUndoRedo && (
                    <Fragment>
                        <button 
                            onClick={undoAction} 
                            disabled={!canUndo}
                            className="tree-view-button"
                        >
                            Undo
                        </button>
                        <button 
                            onClick={redoAction} 
                            disabled={!canRedo}
                            className="tree-view-button"
                        >
                            Redo
                        </button>
                    </Fragment>
                )}
                {props.selectionMode === "multiple" && (
                    <Fragment>
                        <button onClick={selectAll} className="tree-view-button">
                            Select All
                        </button>
                        <button onClick={clearSelection} className="tree-view-button">
                            Clear Selection
                        </button>
                    </Fragment>
                )}
            </div>

            <Tree
                nodes={nodes}
                rootNodes={rootNodes}
                nodeMap={nodeMap}
                expandedNodes={expandedNodes}
                selectedNodes={selectedNodes}
                visibleNodes={visibleNodes}
                highlightedNodes={highlightedNodes}
                focusedNodeId={focusedNodeId}
                nodeContent={props.nodeContent}
                nodeLabelAttribute={props.nodeLabelAttribute}
                indentSize={props.indentSize}
                showLines={props.showLines}
                showIcons={props.showIcons}
                enableVisibilityToggle={props.enableVisibilityToggle}
                enableStickyHeaders={props.enableStickyHeaders}
                virtualScrolling={props.virtualScrolling}
                itemHeight={props.itemHeight}
                overscan={props.overscan}
                expandIcon={props.expandIcon}
                collapseIcon={props.collapseIcon}
                visibilityOnIcon={props.visibilityOnIcon}
                visibilityOffIcon={props.visibilityOffIcon}
                onNodeClick={handleNodeClick}
                onNodeHover={handleNodeHover}
                onNodeContextMenu={handleContextMenu}
                onToggleExpanded={toggleExpanded}
                onToggleVisibility={toggleVisibility}
                isLoading={isLoading}
            />

            {contextMenu && (
                <TreeContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    actions={getContextMenuActions()}
                    onClose={handleCloseContextMenu}
                />
            )}

            {props.debugMode && renderMetrics && (
                <div className="tree-view-metrics">
                    <div>Total nodes: {renderMetrics.totalNodes}</div>
                    <div>Expanded: {renderMetrics.expandedCount}</div>
                    <div>Selected: {renderMetrics.selectedCount}</div>
                    <div>Visible: {renderMetrics.visibleCount}</div>
                </div>
            )}
        </div>
    );
}