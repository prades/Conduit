// THE SEWER DUNGEON'S PROPS (docs/SEWER-PROPS.md §10; the owner, 2026-11-21: "create the framework so that my sewer AI can build this in 3D"): the approved props of the kit
// (design/props/models/_sewer.js SEWER3D, SEWER_KIT) under the game's variant names, so a prop of the map with one of these kinds is drawn like any other (js/propsprites.js PS_FAMILY:
// its sprite in the 2D game, its model in the 3D view):
//   kind[.WxH][.state]     a one-tile prop: kind.state, and kind_turned.state where it has a turned kind (a quarter round: it faces the game's +x, for a wall that runs along y);
//                          a two-tile prop: kind.2x1.state (it faces the game's +y) and kind.1x2.state (the same model a quarter round: it faces +x). The game picks by the prop's own size.
// A kind's first state is how it is found: the game draws it when no state has been set (js/propsprites.js facilityPropState).
{
  const names = [];
  for (const [kind, k] of Object.entries(SEWER_KIT.props)) { const sts = k.states || [null], sq = k.foot[0] === k.foot[1];
    for (const v of sq ? (k.turned ? [kind, kind + '_turned'] : [kind]) : [kind + '.' + k.foot[0] + 'x' + k.foot[1], kind + '.' + k.foot[1] + 'x' + k.foot[0]]) for (const s of sts) names.push(v + (s ? '.' + s : '')); }
  PROPS.sewer = { variants: names, canvas: [440, 440], exposure: 1.05,
    build(name) { const t = name.split('.'), kind = t[0].replace(/_turned$/, ''), k = SEWER_KIT.props[kind]; let dims = null, state = null; for (const x of t.slice(1)) { if (/^\d+x\d+$/.test(x)) dims = x; else state = x; }
      return { g: SEWER3D.prop(kind, state, t[0] !== kind || (!!dims && dims !== k.foot[0] + 'x' + k.foot[1])), marks: {} }; } };
}
