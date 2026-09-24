<template>
  <div class="dimension-diagram" aria-label="Rectangular culture area measurement diagram">
    <div class="dimension-diagram__water">
      <span class="dimension-diagram__length">Length</span>
      <span class="dimension-diagram__width">Width</span>
      <span class="dimension-diagram__depth">Water depth</span>
    </div>
  </div>
</template>

<style scoped>
.dimension-diagram {
  padding: var(--space-7) var(--space-5);
}

.dimension-diagram__water {
  position: relative;
  height: 7.5rem;
  transform: skewY(-5deg);
  border: 2px solid var(--color-brand-600);
  border-radius: var(--radius-md);
  background: linear-gradient(160deg, rgb(186 230 253 / 45%), rgb(45 212 191 / 35%));
}

.dimension-diagram__water span {
  position: absolute;
  transform: skewY(5deg);
  color: var(--color-brand-800);
  font-size: 0.6875rem;
  font-weight: 800;
}

.dimension-diagram__length {
  right: 35%;
  bottom: -1.4rem;
}
.dimension-diagram__width {
  top: 45%;
  left: -1.2rem;
  rotate: -90deg;
}
.dimension-diagram__depth {
  top: 45%;
  right: -2.1rem;
  rotate: 90deg;
}
</style>
