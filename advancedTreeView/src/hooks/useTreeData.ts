import { useCallback, useEffect, useMemo, useState } from "react";
import { ObjectItem } from "mendix";
import { TreeNode, TreeDataHookProps, ParentRelationType } from "../types/TreeTypes";
import { buildTreeFromStructureId, buildTreeFromParentId, buildTreeFromAssociation, sortNodes } from "../utils/treeBuilder";

export function useTreeData(props: TreeDataHookProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [loadedChildren, setLoadedChildren] = useState<Map<string, ObjectItem[]>>(new Map());

    // Build tree structure
    const { nodes, nodeMap, rootNodes } = useMemo(() => {
        if (!props.datasource?.items || props.datasource.items.length === 0) {
            return { nodes: [], nodeMap: new Map(), rootNodes: [] };
        }

        let treeNodes: TreeNode[] = [];
        const items = props.datasource.items;

        // Build tree based on parent relation type
        switch (props.parentRelationType) {
            case "structureId":
                if (props.structureIdAttribute) {
                    treeNodes = buildTreeFromStructureId(
                        items,
                        props.nodeIdAttribute,
                        props.structureIdAttribute,
                        props.visibilityAttribute,
                        props.expandedAttribute
                    );
                }
                break;

            case "association":
                if (props.parentAssociation) {
                    treeNodes = buildTreeFromAssociation(
                        items,
                        props.nodeIdAttribute,
                        props.parentAssociation,
                        props.visibilityAttribute,
                        props.expandedAttribute
                    );
                }
                break;

            case "attribute":
            default:
                if (props.parentIdAttribute) {
                    treeNodes = buildTreeFromParentId(
                        items,
                        props.nodeIdAttribute,
                        props.parentIdAttribute,
                        props.visibilityAttribute,
                        props.expandedAttribute
                    );
                }
                break;
        }

        // Apply sorting if configured
        if (props.sortAttribute) {
            treeNodes = sortNodes(treeNodes, props.sortAttribute, props.sortOrder);
        }

        // Create node map for fast lookups
        const map = new Map<string, TreeNode>();
        const roots: TreeNode[] = [];

        const addToMap = (node: TreeNode) => {
            map.set(node.id, node);
            if (!node.parentId) {
                roots.push(node);
            }
            node.children.forEach(addToMap);
        };

        treeNodes.forEach(addToMap);

        // Expand to default level
        if (props.defaultExpandLevel > 0) {
            const expandToLevel = (node: TreeNode, currentLevel: number) => {
                if (currentLevel < props.defaultExpandLevel) {
                    node.isExpanded = true;
                    if (props.expandedAttribute) {
                        props.expandedAttribute.get(node.objectItem).setValue(true);
                    }
                    node.children.forEach(child => expandToLevel(child, currentLevel + 1));
                }
            };
            roots.forEach(root => expandToLevel(root, 0));
        }

        return { nodes: treeNodes, nodeMap: map, rootNodes: roots };
    }, [
        props.datasource,
        props.nodeIdAttribute,
        props.parentRelationType,
        props.parentIdAttribute,
        props.parentAssociation,
        props.structureIdAttribute,
        props.visibilityAttribute,
        props.expandedAttribute,
        props.sortAttribute,
        props.sortOrder,
        props.defaultExpandLevel
    ]);

    // Load children for a node (lazy loading)
    const loadChildren = useCallback(async (nodeId: string) => {
        if (!props.lazyLoadChildren || !props.lazyLoadAction) {
            return;
        }

        const node = nodeMap.get(nodeId);
        if (!node || loadedChildren.has(nodeId)) {
            return;
        }

        setIsLoading(true);
        try {
            // Execute the lazy load action for this node
            if (props.lazyLoadAction.canExecute) {
                await props.lazyLoadAction.execute();
                
                // The action should have loaded new items into the datasource
                // We need to refresh the tree structure
                // This will be handled by the datasource change triggering a re-render
            }
        } catch (error) {
            console.error("Error loading children:", error);
        } finally {
            setIsLoading(false);
        }
    }, [nodeMap, loadedChildren, props.lazyLoadChildren, props.lazyLoadAction]);

    // Refresh nodes when datasource changes
    const refreshNodes = useCallback(() => {
        // Force a refresh by clearing loaded children
        setLoadedChildren(new Map());
    }, []);

    // Get visible nodes based on expansion state
    const getVisibleNodes = useCallback((node: TreeNode, expandedNodes: Set<string>): TreeNode[] => {
        const visible: TreeNode[] = [node];
        
        if (expandedNodes.has(node.id) && node.children.length > 0) {
            node.children.forEach(child => {
                visible.push(...getVisibleNodes(child, expandedNodes));
            });
        }
        
        return visible;
    }, []);

    // Get all descendant IDs
    const getDescendantIds = useCallback((node: TreeNode): string[] => {
        const ids: string[] = [];
        
        const collectIds = (n: TreeNode) => {
            ids.push(n.id);
            n.children.forEach(collectIds);
        };
        
        node.children.forEach(collectIds);
        return ids;
    }, []);

    // Get ancestor IDs
    const getAncestorIds = useCallback((nodeId: string): string[] => {
        const ids: string[] = [];
        let current = nodeMap.get(nodeId);
        
        while (current?.parentId) {
            ids.push(current.parentId);
            current = nodeMap.get(current.parentId);
        }
        
        return ids;
    }, [nodeMap]);

    // Find node by path
    const findNodeByPath = useCallback((path: string[]): TreeNode | null => {
        if (path.length === 0) return null;
        
        let current: TreeNode | undefined = rootNodes.find(r => r.id === path[0]);
        
        for (let i = 1; i < path.length && current; i++) {
            current = current.children.find(c => c.id === path[i]);
        }
        
        return current || null;
    }, [rootNodes]);

    return {
        nodes,
        nodeMap,
        rootNodes,
        isLoading,
        loadChildren,
        refreshNodes,
        getVisibleNodes,
        getDescendantIds,
        getAncestorIds,
        findNodeByPath
    };
}