<template>
  <div class="promotion-overlay" role="dialog" aria-modal="true">
    <div class="promotion-dialog">
      <h3 class="promotion-title">Choose promotion piece</h3>
      <div class="promotion-pieces">
        <button class="promotion-piece" @click="$emit('select', 'Q')" aria-label="Promote to Queen">
          ♕
          <span>Queen</span>
        </button>
        <button class="promotion-piece" @click="$emit('select', 'R')" aria-label="Promote to Rook">
          ♖
          <span>Rook</span>
        </button>
        <button class="promotion-piece" @click="$emit('select', 'B')" aria-label="Promote to Bishop">
          ♗
          <span>Bishop</span>
        </button>
        <button class="promotion-piece" @click="$emit('select', 'N')" aria-label="Promote to Knight">
          ♘
          <span>Knight</span>
        </button>
      </div>
      <div class="flex-center">
        <button class="promotion-cancel" @click="$emit('cancel')">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script>
export default { name: 'PromotionModal' }
</script>

<style scoped>
/* No extra styles; relies on shared/common.css promotion classes */
</style>
