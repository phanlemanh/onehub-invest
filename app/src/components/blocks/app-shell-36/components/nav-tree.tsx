import { useMemo, useState, type ReactNode } from "react"
import {
  Tree,
  TreeItem,
  TreeItemLabel,
} from "@/components/reui/tree"
import {
  hotkeysCoreFeature,
  selectionFeature,
  syncDataLoaderFeature,
} from "@headless-tree/core"
import { useTree } from "@headless-tree/react"
import { cn } from "cn"

import { isBranch, type NavGroup } from "./data"
import { CAP_TRUNCATE } from "./value-faces"

// 22px steps (14px chevron + 8px gap) seat a child's glyph under its branch's
// glyph; the guide line, pulled 7px in, then runs under the chevron.
const INDENT = 22

const GUIDES =
  "relative before:absolute before:inset-0 before:-ms-1.75 before:bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)))]"

// The sidebar's row on the tree label; a leaf drops the chevron gutter to line
// up with Home, and c-tree-3's cover keeps the guide line to the gutter.
const TREE_ROW = cn(
  "text-muted-foreground h-8 gap-2 text-xs font-medium not-in-data-[folder=true]:ps-2",
  "hover:text-sidebar-accent-foreground [&_svg]:size-4 [&_svg]:text-ring [&:hover_svg]:text-sidebar-accent-foreground",
  "[[data-selected=true]_&]:text-foreground [[data-selected=true]_&_svg]:text-foreground",
  "[[data-selected=true]:not(:focus-visible)_&]:ring-input/50 [[data-selected=true]:not(:focus-visible)_&]:ring-1 [[data-selected=true]:not(:focus-visible)_&]:ring-inset",
  "before:bg-background relative before:absolute before:inset-x-0 before:-inset-y-0.5 before:-z-10",
  // app-shell-27's toggle: a 14px chevron turning in 200ms, full ink while
  // open, and no hover fill on a branch that is not standing in for the page.
  "[[data-folder=true]_&>svg:first-child]:size-3.5 [[data-folder=true]_&>svg:first-child]:transition-transform [[data-folder=true]_&>svg:first-child]:duration-200 motion-reduce:[[data-folder=true]_&>svg:first-child]:transition-none",
  "[[aria-expanded=true]_&]:text-foreground [[aria-expanded=true]_&_svg]:text-foreground [[data-folder=true][data-selected=false]_&]:hover:bg-transparent"
)

const LABEL = cn(CAP_TRUNCATE, "min-w-0")

type NavNode = {
  name: string
  icon?: ReactNode
  children?: string[]
}

/** The group as the tree's records: the group itself is the hidden root. */
function toNodes(group: NavGroup) {
  const nodes: Record<string, NavNode> = {
    [group.id]: {
      name: group.label,
      children: group.entries.map((entry) => entry.id),
    },
  }
  for (const entry of group.entries) {
    if (isBranch(entry)) {
      nodes[entry.id] = {
        name: entry.label,
        icon: entry.icon,
        children: entry.children.map((page) => page.id),
      }
      for (const page of entry.children) {
        nodes[page.id] = { name: page.label, icon: page.icon }
      }
    } else {
      nodes[entry.id] = { name: entry.label, icon: entry.icon }
    }
  }
  return nodes
}

export function NavTree({
  group,
  labelId,
  activePage,
  onNavigate,
  searching,
}: {
  group: NavGroup
  /** The group label's id: the tree takes its name from it. */
  labelId: string
  activePage: string
  onNavigate: (id: string) => void
  /** A search holds every branch open so its matches show. */
  searching: boolean
}) {
  const nodes = useMemo(() => toNodes(group), [group])
  const branches = useMemo(
    () => group.entries.filter(isBranch).map((entry) => entry.id),
    [group]
  )
  const [expanded, setExpanded] = useState(branches)
  const expandedItems = searching ? branches : expanded
  // A folded branch stands in for the open page it hides.
  const foldedHolder = group.entries.find(
    (entry) =>
      isBranch(entry) &&
      !expandedItems.includes(entry.id) &&
      entry.children.some((page) => page.id === activePage)
  )

  const tree = useTree<NavNode>({
    // The open page is the selection; a click or Enter on a leaf opens it.
    state: {
      selectedItems: foldedHolder
        ? [activePage, foldedHolder.id]
        : [activePage],
      expandedItems,
    },
    setSelectedItems: () => {},
    setExpandedItems: (updater) =>
      setExpanded((current) =>
        typeof updater === "function" ? updater(current) : updater
      ),
    onPrimaryAction: (item) => {
      if (!item.isFolder()) onNavigate(item.getId())
    },
    indent: INDENT,
    rootItemId: group.id,
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => Boolean(item.getItemData()?.children),
    dataLoader: {
      getItem: (itemId) => nodes[itemId],
      getChildren: (itemId) => nodes[itemId]?.children ?? [],
    },
    features: [syncDataLoaderFeature, selectionFeature, hotkeysCoreFeature],
  })

  return (
    <Tree
      indent={INDENT}
      tree={tree}
      aria-labelledby={labelId}
      className={GUIDES}
    >
      {tree.getItems().map((item) => {
        const node = item.getItemData()
        return (
          <TreeItem key={item.getId()} item={item}>
            <TreeItemLabel className={TREE_ROW}>
              {node.icon}
              <span className={LABEL}>{node.name}</span>
            </TreeItemLabel>
          </TreeItem>
        )
      })}
    </Tree>
  )
}