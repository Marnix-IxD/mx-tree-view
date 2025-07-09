import { useCallback, useEffect, useState } from "react";
import { TreeNode, TreeSelectionHookProps } from "../types/TreeTypes";

export function useTreeSelection(props: TreeSelectionHookProps) {
    const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

    // Update selection output
    useEffect(() => {
        if (!props.selectionOutputAttribute || selectedNodes.size === 0) {
            return;
        }

        let output = "";

        switch (props.selectionOutputType) {
            case "guids":
                output = Array.from(selectedNodes)
                    .map(id => {
                        const node = props.nodeMap.get(id);
                        return node ? node.objectItem.id : null;
                    })
                    .filter(Boolean)
                    .join(",");
                break;

            case "attributes":
                output = Array.from(selectedNodes).join(",");
                break;

            case "structureIds":
                output = Array.from(selectedNodes)
                    .map(id => {
                        const node = props.nodeMap.get(id);
                        return node?.structureId || "";
                    })
                    .filter(Boolean)
                    .join(",");
                break;
        }

        props.selectionOutputAttribute.setValue(output);

        // Execute selection change action
        if (props.onSelectionChange && props.onSelectionChange.canExecute) {
            props.onSelectionChange.execute();
        }
    }, [selectedNodes, props]);

    // Toggle selection
    const toggleSelection = useCallback((nodeId: string) => {
        if (props.selectionMode === "none") return;

        setSelectedNodes(prev => {
            const newSelection = new Set(prev);
            
            if (props.selectionMode === "single") {
                // Single selection mode
                newSelection.clear();
                newSelection.add(nodeId);
            } else {
                // Multiple selection mode
                if (newSelection.has(nodeId)) {
                    newSelection.delete(nodeId);
                } else {
                    newSelection.add(nodeId);
                }
            }

            return newSelection;
        });

        setLastSelectedId(nodeId);
    }, [props.selectionMode]);

    // Select single node
    const selectNode = useCallback((nodeId: string) => {
        if (props.selectionMode === "none") return;

        setSelectedNodes(new Set([nodeId]));
        setLastSelectedId(nodeId);
        setFocusedNodeId(nodeId);
    }, [props.selectionMode]);

    // Clear selection
    const clearSelection = useCallback(() => {
        setSelectedNodes(new Set());
        setLastSelectedId(null);
    }, []);

    // Select all nodes
    const selectAll = useCallback(() => {
        if (props.selectionMode !== "multiple") return;

        const allNodeIds = props.nodes.map(node => node.id);
        setSelectedNodes(new Set(allNodeIds));
    }, [props.selectionMode, props.nodes]);

    // Select range of nodes
    const selectRange = useCallback((fromId: string, toId: string) => {
        if (props.selectionMode !== "multiple" || !props.enableMultiSelect) return;

        // Get flat list of visible nodes
        const visibleNodes: TreeNode[] = [];
        
        const collectVisible = (nodes: TreeNode[]) => {
            nodes.forEach(node => {
                visibleNodes.push(node);
                if (node.children.length > 0) {
                    collectVisible(node.children);
                }
            });
        };

        // Get root nodes
        const rootNodes = props.nodes.filter(node => !node.parentId);
        collectVisible(rootNodes);

        // Find indices
        const fromIndex = visibleNodes.findIndex(n => n.id === fromId);
        const toIndex = visibleNodes.findIndex(n => n.id === toId);

        if (fromIndex === -1 || toIndex === -1) return;

        // Select range
        const startIndex = Math.min(fromIndex, toIndex);
        const endIndex = Math.max(fromIndex, toIndex);

        const rangeNodes = visibleNodes
            .slice(startIndex, endIndex + 1)
            .map(n => n.id);

        setSelectedNodes(prev => {
            const newSelection = new Set(prev);
            rangeNodes.forEach(id => newSelection.add(id));
            return newSelection;
        });
    }, [props]);

    // Handle multi-select with modifiers
    const handleNodeSelection = useCallback((nodeId: string, event: React.MouseEvent) => {
        if (props.selectionMode === "none") return;

        const node = props.nodeMap.get(nodeId);
        if (!node) return;

        if (props.selectionMode === "single") {
            selectNode(nodeId);
            return;
        }

        // Multiple selection mode
        if (!props.enableMultiSelect) {
            selectNode(nodeId);
            return;
        }

        const isCtrlOrCmd = event.ctrlKey || event.metaKey;
        const isShift = event.shiftKey;

        if (isCtrlOrCmd) {
            // Toggle selection
            toggleSelection(nodeId);
        } else if (isShift && lastSelectedId) {
            // Range selection
            selectRange(lastSelectedId, nodeId);
        } else {
            // Single selection
            selectNode(nodeId);
        }
    }, [props, lastSelectedId, selectNode, toggleSelection, selectRange]);

    // Select nodes by predicate
    const selectByPredicate = useCallback((predicate: (node: TreeNode) => boolean) => {
        if (props.selectionMode !== "multiple") return;

        const matchingIds = props.nodes
            .filter(predicate)
            .map(node => node.id);

        setSelectedNodes(new Set(matchingIds));
    }, [props]);

    // Invert selection
    const invertSelection = useCallback(() => {
        if (props.selectionMode !== "multiple") return;

        const allIds = new Set(props.nodes.map(n => n.id));
        const inverted = new Set<string>();

        allIds.forEach(id => {
            if (!selectedNodes.has(id)) {
                inverted.add(id);
            }
        });

        setSelectedNodes(inverted);
    }, [props, selectedNodes]);

    // Get selected items
    const getSelectedItems = useCallback(() => {
        return Array.from(selectedNodes)
            .map(id => props.nodeMap.get(id))
            .filter((node): node is TreeNode => node !== undefined);
    }, [selectedNodes, props.nodeMap]);

    return {
        selectedNodes,
        focusedNodeId,
        setFocusedNodeId,
        toggleSelection,
        selectNode,
        clearSelection,
        selectAll,
        selectRange,
        handleNodeSelection,
        selectByPredicate,
        invertSelection,
        getSelectedItems
    };
}