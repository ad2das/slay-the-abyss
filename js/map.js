/* ==========================================================================
   SLAY THE ABYSS - SPIRE MAP GENERATOR & NODE TREE
   ========================================================================== */

class SpireMap {
  constructor(totalFloors = 15) {
    this.totalFloors = totalFloors;
    this.floors = [];
    this.currentNode = null;
    this.visitedNodes = new Set();
  }

  generate() {
    this.floors = [];
    this.visitedNodes = new Set();
    this.currentNode = null;

    const laneCount = 4;

    for (let f = 0; f < this.totalFloors; f++) {
      const floorNodes = [];

      if (f === 0) {
        // Floor 1: 3-4 Starter Monster nodes
        for (let l = 0; l < laneCount; l++) {
          floorNodes.push({
            id: `f0_l${l}`,
            floor: 0,
            lane: l,
            type: 'monster',
            icon: '⚔️',
            name: '일반 몬스터',
            connections: []
          });
        }
      } else if (f === this.totalFloors - 1) {
        // Floor 15: Boss
        floorNodes.push({
          id: `f${f}_boss`,
          floor: f,
          lane: 1.5,
          type: 'boss',
          icon: '👹',
          name: '첨탑의 수호자 (BOSS)',
          connections: []
        });
      } else if (f === this.totalFloors - 2) {
        // Floor 14: Guaranteed Campfire before Boss
        for (let l = 1; l <= 2; l++) {
          floorNodes.push({
            id: `f${f}_l${l}`,
            floor: f,
            lane: l,
            type: 'rest',
            icon: '⛺',
            name: '휴식처',
            connections: []
          });
        }
      } else {
        // Intermediate Floors
        const numNodesInFloor = Math.floor(Math.random() * 2) + 3; // 3 to 4 nodes
        const possibleTypes = ['monster', 'monster', 'unknown', 'unknown', 'rest', 'shop'];
        if (f >= 5) possibleTypes.push('elite');

        for (let n = 0; n < numNodesInFloor; n++) {
          const l = n;
          const chosenType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
          const icons = {
            monster: '⚔️',
            elite: '💀',
            unknown: '❓',
            rest: '⛺',
            shop: '💰'
          };
          const names = {
            monster: '일반 몬스터',
            elite: '강력한 엘리트',
            unknown: '미지의 방',
            rest: '휴식처',
            shop: '상점'
          };

          floorNodes.push({
            id: `f${f}_l${l}`,
            floor: f,
            lane: l,
            type: chosenType,
            icon: icons[chosenType],
            name: names[chosenType],
            connections: []
          });
        }
      }

      this.floors.push(floorNodes);
    }

    // Connect nodes upwards
    for (let f = 0; f < this.totalFloors - 1; f++) {
      const currentFloor = this.floors[f];
      const nextFloor = this.floors[f + 1];

      currentFloor.forEach(node => {
        if (nextFloor.length === 1) {
          // Boss node
          node.connections.push(nextFloor[0].id);
        } else {
          // Connect to 1-2 nearest nodes in next floor
          nextFloor.forEach(nextNode => {
            if (Math.abs(node.lane - nextNode.lane) <= 1.2) {
              node.connections.push(nextNode.id);
            }
          });
          if (node.connections.length === 0) {
            node.connections.push(nextFloor[0].id);
          }
        }
      });
    }

    return this.floors;
  }

  getReachableNodes() {
    if (!this.currentNode) {
      // First floor nodes are all reachable
      return this.floors[0].map(n => n.id);
    }
    const currentObj = this.findNode(this.currentNode);
    return currentObj ? currentObj.connections : [];
  }

  findNode(nodeId) {
    for (const fl of this.floors) {
      for (const n of fl) {
        if (n.id === nodeId) return n;
      }
    }
    return null;
  }

  render(containerEl, svgEl, onNodeSelect) {
    containerEl.innerHTML = '';
    svgEl.innerHTML = '';

    const width = containerEl.clientWidth || 700;
    const height = 1100;
    containerEl.style.height = `${height}px`;

    const floorHeight = height / (this.totalFloors + 1);
    const reachableIds = new Set(this.getReachableNodes());

    // 1. Draw SVG Connecting Lines
    for (let f = 0; f < this.totalFloors - 1; f++) {
      this.floors[f].forEach(node => {
        const x1 = ((node.lane + 0.5) / 4) * width;
        const y1 = height - (node.floor + 1) * floorHeight;

        node.connections.forEach(targetId => {
          const targetNode = this.findNode(targetId);
          if (targetNode) {
            const x2 = ((targetNode.lane + 0.5) / 4) * width;
            const y2 = height - (targetNode.floor + 1) * floorHeight;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', '#64748b');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('stroke-dasharray', '4 4');
            svgEl.appendChild(line);
          }
        });
      });
    }

    // 2. Render Node Elements
    for (let f = 0; f < this.totalFloors; f++) {
      this.floors[f].forEach(node => {
        const x = ((node.lane + 0.5) / 4) * width;
        const y = height - (node.floor + 1) * floorHeight;

        const el = document.createElement('div');
        el.className = `map-node ${node.type}-node`;
        if (reachableIds.has(node.id)) el.classList.add('reachable');
        if (this.visitedNodes.has(node.id)) el.classList.add('visited');
        if (node.type === 'boss') el.classList.add('boss-node');

        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.innerHTML = node.icon;
        el.title = `${node.name} (Floor ${node.floor + 1})`;

        if (reachableIds.has(node.id)) {
          el.addEventListener('click', () => {
            this.currentNode = node.id;
            this.visitedNodes.add(node.id);
            window.soundEngine.playSFX('card_play');
            onNodeSelect(node);
          });
        }

        containerEl.appendChild(el);
      });
    }
  }
}

window.SpireMap = SpireMap;
