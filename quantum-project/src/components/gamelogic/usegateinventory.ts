import { ref, computed } from 'vue'
import type { Level } from '@/game/quantumgame'

// Shared laser-gate inventory + drag/drop logic used by home and lab
export function useGateInventory() {
  const sourceGates = ref<string[][]>([])
  const gateInventory = ref<Record<string, number>>({})
  const activeSourceIndex = ref(0)
  const draggedGateIndex = ref<number | null>(null)

  const activeGates = computed(() => sourceGates.value[activeSourceIndex.value] ?? [])

  // Take sourcegates from level's prePlacedGates
  function setSourceGatesFromLevel(level: Level) {
    sourceGates.value = level.sources.map((_, i) => {
      return level.prePlacedGates && level.prePlacedGates[i] ? [...level.prePlacedGates[i]!] : []
    })
  }

  // Reset gateInventory from level/config and deduct locked
  function resetGateInventory(
    inventorySource: Record<string, number>,
    lockedGateIndices: number[],
    requirePositive = false,
  ) {
    gateInventory.value = { ...inventorySource }

    const flatLocked = sourceGates.value.flat()
    for (const idx of lockedGateIndices) {
      if (idx < flatLocked.length) {
        const gate = flatLocked[idx]
        if (!gate) continue
        const count = gateInventory.value[gate]
        if (count === undefined) continue
        if (requirePositive && count <= 0) continue
        gateInventory.value[gate] = count - 1
      }
    }
  }

  function isGateLocked(level: Level, localIndex: number) {
    const activeIdx = activeSourceIndex.value
    const prePlacedCount = level.prePlacedGates?.[activeIdx]?.length || 0
    return localIndex < prePlacedCount
  }

  function onGateDragStart(e: DragEvent, gateType: string) {
    const available = gateInventory.value[gateType] ?? -1
    if (available === 0) {
      e.preventDefault()
      return
    }
    draggedGateIndex.value = null
    e.dataTransfer!.effectAllowed = 'copy'
    e.dataTransfer!.setData('gateType', gateType)
  }

  // Drag already placed gates
  function onPlacedGateDragStart(e: DragEvent, level: Level, index: number, gateType: string) {
    if (isGateLocked(level, index)) {
      e.preventDefault()
      return
    }
    draggedGateIndex.value = index
    e.dataTransfer!.effectAllowed = 'move'
    e.dataTransfer!.setData('gateType', gateType)
  }

  function onLaserDragOver(e: DragEvent) {
    e.preventDefault()
    e.dataTransfer!.dropEffect = draggedGateIndex.value !== null ? 'move' : 'copy'
  }

  // place new gate or move existing gate to new position
  function handleDrop(e: DragEvent, level: Level, dropIndex?: number): boolean {
    e.preventDefault()
    const gateType = e.dataTransfer!.getData('gateType')
    if (!gateType) return false

    const idx = activeSourceIndex.value
    if (!sourceGates.value[idx]) sourceGates.value[idx] = []
    const list = sourceGates.value[idx]!

    // Protect locked gates from being moved
    const lockedCount = level.prePlacedGates?.[idx]?.length || 0
    let safeDropIndex = dropIndex !== undefined ? Math.max(dropIndex, lockedCount) : list.length

    if (draggedGateIndex.value !== null) {
      const oldIndex = draggedGateIndex.value
      if (oldIndex === safeDropIndex) return false

      const [movedGate] = list.splice(oldIndex, 1)

      if (oldIndex < safeDropIndex && dropIndex !== undefined) {
        safeDropIndex--
      }

      list.splice(safeDropIndex, 0, movedGate!)
    } else {
      if (gateInventory.value[gateType] !== undefined) {
        if (gateInventory.value[gateType]! > 0) {
          gateInventory.value[gateType]!--
        } else {
          return false
        }
      }
      list.splice(safeDropIndex, 0, gateType)
    }

    draggedGateIndex.value = null
    return true
  }

  function onLaserDrop(e: DragEvent, level: Level) {
    return handleDrop(e, level)
  }

  // Drop target for reorder
  function onPlacedGateDrop(e: DragEvent, level: Level, dropIndex: number) {
    return handleDrop(e, level, dropIndex)
  }

  function removeLaserGate(level: Level, index: number): boolean {
    const activeIdx = activeSourceIndex.value

    if (isGateLocked(level, index)) {
      return false
    }

    const gate = sourceGates.value[activeIdx]?.[index]
    if (!gate) return false

    sourceGates.value[activeIdx]!.splice(index, 1)

    if (gateInventory.value[gate] !== undefined) {
      gateInventory.value[gate]!++
    }
    return true
  }

  // Click to add (don't drag)
  function addGateToActive(gateType: string): boolean {
    const available = gateInventory.value[gateType] ?? -1
    if (available === 0) return false
    if (gateInventory.value[gateType] !== undefined) {
      gateInventory.value[gateType]!--
    }
    const idx = activeSourceIndex.value
    if (!sourceGates.value[idx]) sourceGates.value[idx] = []
    sourceGates.value[idx].push(gateType)
    return true
  }

  // Find source index at a board cell
  function findSourceIndexAt(level: Level, col: number, row: number) {
    return level.sources.findIndex(s => s.col === col && s.row === row)
  }

  return {
    sourceGates,
    gateInventory,
    activeSourceIndex,
    draggedGateIndex,
    activeGates,
    setSourceGatesFromLevel,
    resetGateInventory,
    isGateLocked,
    onGateDragStart,
    onPlacedGateDragStart,
    onLaserDragOver,
    onLaserDrop,
    onPlacedGateDrop,
    removeLaserGate,
    addGateToActive,
    findSourceIndexAt,
  }
}