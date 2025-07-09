import { ReactElement, createElement, useCallback, useRef, memo } from "react";
import { DynamicValue, WebIcon } from "mendix";
import { TreeNode } from "../../types/TreeTypes";
import { TreeVirtualizer } from "../Tree/TreeVirtualizer";
import { TreeNodeComponent } from "../Tree/TreeNode";
import { useVirtualizer } from "../../hooks/useVirtualizer";
import "./Tree.css";

interface TreeProps {
    nodes: TreeNode[];
    rootNodes: TreeNode[];
    nodeMap: Map<string, TreeNode>;
    expandedNodes: Set<string>;
    selectedNodes: Set<string>;
    visibleNodes: Set<string>;
    highlightedNodes: Set<string>;
    focusedNodeId: string | null;
    nodeContent: any;
    indentSize: number;
    showLines: boolean;
    showIcons: boolean;
    enableVisibilityToggle: boolean;
    enableStickyHeaders: boolean;
    virtualScrolling: boolean;
    itemHeight: number;
    overscan: number;
    expandIcon?: DynamicValue<WebIcon>;
    collapseIcon?: DynamicValue<WebIcon>;
    visibilityOnIcon?: DynamicValue<WebIcon>;
    visibilityOffIcon?: DynamicValue<WebIcon>;
    onNodeClick: (node: TreeNode) => void;
    onNodeHover: (node: TreeNode) => void;
    onNodeContextMenu: (e: React.MouseEvent, node: TreeNode) => void;
    onToggleExpanded: (nodeId: string) => void;
    onToggleVisibility: (nodeId: string) => void;
    isLoading: boolean;
}

export const Tree = memo(function Tree(props: TreeProps): ReactElement {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Get visible nodes based on expansion state
    const getVisibleFlatNodes = useCallback((): TreeNode[] => {
        const visible: TreeNode[] = [];

        const traverse = (node: TreeNode) => {
            visible.push(node);
            if (props.expandedNodes.has(node.id) && node.children.length > 0) {
                node.children.forEach(traverse);
            }
        };

        props.rootNodes.forEach(traverse);
        return visible;
    }, [props.rootNodes, props.expandedNodes]);

    const visibleFlatNodes = getVisibleFlatNodes();

    // Use virtualizer hook if virtual scrolling is enabled
    const virtualizer = useVirtualizer({
        count: visibleFlatNodes.length,
        getScrollElement: () => scrollContainerRef.current,
        estimateSize: () => props.itemHeight,
        overscan: props.overscan,
        enabled: props.virtualScrolling
    });

    // Render a single node
    const renderNode = useCallback((node: TreeNode, index: number) => {
        const isSelected = props.selectedNodes.has(node.id);
        const isHighlighted = props.highlightedNodes.has(node.id);
        const isFocused = props.focusedNodeId === node.id;
        const isVisible = props.visibleNodes.has(node.id);
        const isExpanded = props.expandedNodes.has(node.id);

        // Check if any ancestor is sticky
        let hasStickyAncestor = false;
        if (props.enableStickyHeaders) {
            let parent = node.parentId ? props.nodeMap.get(node.parentId) : null;
            while (parent) {
                if (props.expandedNodes.has(parent.id)) {
                    hasStickyAncestor = true;
                    break;
                }
                parent = parent.parentId ? props.nodeMap.get(parent.parentId) : null;
            }
        }

        return (
            <TreeNodeComponent
                key={node.id}
                node={node}
                nodeContent={props.nodeContent}
                indentSize={props.indentSize}
                showLines={props.showLines}
                showIcons={props.showIcons}
                enableVisibilityToggle={props.enableVisibilityToggle}
                isSelected={isSelected}
                isHighlighted={isHighlighted}
                isFocused={isFocused}
                isVisible={isVisible}
                isExpanded={isExpanded}
                isSticky={props.enableStickyHeaders && !node.isLeaf && isExpanded}
                hasStickyAncestor={hasStickyAncestor}
                onClick={() => props.onNodeClick(node)}
                onHover={() => props.onNodeHover(node)}
                onContextMenu={(e) => props.onNodeContextMenu(e, node)}
                onToggleExpanded={() => props.onToggleExpanded(node.id)}
                onToggleVisibility={() => props.onToggleVisibility(node.id)}
            />
        );
    }, [
        props.selectedNodes,
        props.highlightedNodes,
        props.focusedNodeId,
        props.visibleNodes,
        props.expandedNodes,
        props.nodeMap,
        props.nodeContent,
        props.indentSize,
        props.showLines,
        props.showIcons,
        props.enableVisibilityToggle,
        props.enableStickyHeaders,
        props.onNodeClick,
        props.onNodeHover,
        props.onNodeContextMenu,
        props.onToggleExpanded,
        props.onToggleVisibility
    ]);

    if (props.isLoading && visibleFlatNodes.length === 0) {
        return (
            <div className="tree-view-loading">
                <div className="tree-view-spinner"></div>
                <span>Loading...</span>
            </div>
        );
    }

    if (visibleFlatNodes.length === 0) {
        return (
            <div className="tree-view-empty">
                <span>No items to display</span>
            </div>
        );
    }

    if (props.virtualScrolling) {
        return (
            <TreeVirtualizer
                scrollContainerRef={scrollContainerRef}
                virtualizer={virtualizer}
                visibleFlatNodes={visibleFlatNodes}
                renderNode={renderNode}
            />
        );
    }

    // Non-virtualized rendering
    return (
        <div className="tree-view-container" ref={scrollContainerRef}>
            <div className="tree-view-content">
                {visibleFlatNodes.map((node, index) => renderNode(node, index))}
            </div>
        </div>
    );
});