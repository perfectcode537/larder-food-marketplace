/* Larder demo data. Every shop, person, price and review here is made up. */
(function () {
  const IMG = 'assets/img/';

  // opening hours, index 0 = Sunday. [open, close] in 24h, null = closed
  const H = {
    bakery:  [[8, 16], [7, 18], [7, 18], [7, 18], [7, 18], [7, 18], [7, 17]],
    long:    [[10, 18], [9, 21], [9, 21], [9, 21], [9, 21], [9, 21], [9, 21]],
    shop:    [[10, 16], [9, 19], [9, 19], [9, 19], [9, 19], [9, 19], [9, 18]],
    fish:    [null, null, [8, 18], [8, 18], [8, 18], [8, 19], [7, 17]],
    cheese:  [[10, 16], null, [10, 19], [10, 19], [10, 19], [10, 20], [9, 19]],
    wine:    [[12, 20], [12, 22], [12, 22], [12, 22], [12, 22], [12, 23], [11, 23]],
    coffee:  [[8, 16], [7, 17], [7, 17], [7, 17], [7, 17], [7, 17], [8, 16]],
    daily:   [[9, 18], [9, 19], [9, 19], [9, 19], [9, 19], [9, 19], [9, 19]],
  };

  const categories = [
    { id: 'bakery', label: 'Bakery', img: IMG + 'p/croissant.webp' },
    { id: 'grocer', label: 'Greengrocer', img: IMG + 'p/tomatoes.webp' },
    { id: 'cheese', label: 'Cheese', img: IMG + 'p/comte.webp' },
    { id: 'fish', label: 'Fishmonger', img: IMG + 'p/sea-bass.webp' },
    { id: 'pantry', label: 'Pantry & spice', img: IMG + 'p/spice-box.webp' },
    { id: 'sweet', label: 'Sweet things', img: IMG + 'p/ring-sprinkle.webp' },
    { id: 'drinks', label: 'Coffee & wine', img: IMG + 'p/gamay.webp' },
  ];

  const shops = [
    {
      id: 'crumb', name: 'Crumb & Kiln', kind: 'Bakehouse', cat: 'bakery',
      area: 'Clapton', street: '41 Chatsworth Road, E5', est: 2014,
      owner: 'Maren Holt', ownerRole: 'Head baker',
      tagline: 'Long-ferment sourdough and laminated pastry, out of the oven by 7.',
      story: 'Maren started with one wood-fired oven and a 1930s starter she still feeds twice a day. Everything is mixed by hand the night before and baked in small batches, so the 3pm croissant is as good as the 7am one.',
      quote: 'Bread wants time more than it wants anything else. We just give it plenty.',
      rating: 4.9, reviews: 1284, dist: 0.6, eta: [25, 35], min: 6,
      hours: H.bakery, tags: ['Organic flour', 'Vegan options'],
      color: '#C8692B', ink: '#FFF6E8', mono: 'C&K', x: 180, y: 160,
      cover: IMG + 'cover/crumb.webp', video: 'assets/video/crumb.mp4', poster: IMG + 'poster/crumb.webp',
      scene: IMG + 'p/dough.webp',
      pairs: ['rind', 'hive', 'ember'],
      sections: [
        { name: 'Pastries', items: [
          { id: 'croissant', name: 'Butter croissant', desc: 'Three-day lamination with cultured Normandy butter. Shatters properly.', price: 2.8, unit: 'each', img: 'p/croissant', badges: ['V'], tag: 'Bestseller', allergens: 'Gluten, milk, egg' },
          { id: 'pain-choc', name: 'Pain au chocolat', desc: 'Two batons of 70% chocolate from Nib & Bar, three streets away.', price: 3.2, unit: 'each', img: 'p/pain-choc', badges: ['V'], allergens: 'Gluten, milk, egg, soya' },
          { id: 'almond', name: 'Twice-baked almond croissant', desc: 'Yesterday’s croissant, frangipane, flaked almonds, more butter.', price: 3.6, unit: 'each', badges: ['V'], allergens: 'Gluten, milk, egg, nuts' },
          { id: 'cardamom', name: 'Cardamom knot', desc: 'Swedish-style bun with freshly ground green cardamom and pearl sugar.', price: 3.4, unit: 'each', badges: ['V'], tag: 'New', allergens: 'Gluten, milk, egg' },
          { id: 'pear-danish', name: 'Pear & frangipane danish', desc: 'Poached Conference pears from Patch & Furrow. Only while the pears last.', price: 3.8, unit: 'each', badges: ['V'], tag: 'Seasonal', season: [8, 9, 10], allergens: 'Gluten, milk, egg, nuts' },
        ] },
        { name: 'Loaves', items: [
          { id: 'sourdough', name: 'Country sourdough, 800g', desc: 'White and wholemeal, 36-hour cold proof, dark blistered crust.', price: 5.2, unit: 'loaf', badges: ['VG'], tag: 'Bestseller', allergens: 'Gluten' },
          { id: 'seeded', name: 'Seeded malt tin', desc: 'Sunflower, pumpkin, linseed and barley malt. Toasts beautifully.', price: 4.6, unit: 'loaf', img: 'p/seeded-loaf', badges: ['VG'], allergens: 'Gluten, sesame' },
          { id: 'brioche', name: 'Brioche loaf', desc: 'Rich, golden and pull-apart soft. Makes a serious French toast.', price: 5.5, unit: 'loaf', img: 'p/brioche', badges: ['V'], allergens: 'Gluten, milk, egg' },
          { id: 'rye', name: 'Dark rye, 100%', desc: 'Dense Nordic rye with caraway and black treacle. Keeps for a week.', price: 4.8, unit: 'loaf', badges: ['VG'], allergens: 'Gluten' },
          { id: 'focaccia', name: 'Olive & rosemary focaccia', desc: 'Nocellara olives, Maldon salt and a lot of good olive oil.', price: 4.2, unit: 'slab', badges: ['VG'], allergens: 'Gluten' },
        ] },
        { name: 'Bake at home', items: [
          { id: 'dough', name: 'Pizza dough balls × 2', desc: '48-hour dough, ready to stretch. Pairs with Fiorella’s San Marzanos.', price: 3.5, unit: 'pack', img: 'p/dough', badges: ['VG'], allergens: 'Gluten' },
          { id: 'starter', name: 'Sourdough starter, 150g', desc: 'A scoop of our 1930s mother, with feeding notes in Maren’s handwriting.', price: 4, unit: 'jar', badges: ['VG'], allergens: 'Gluten' },
        ] },
      ],
      reviewList: [
        { name: 'Ola B.', stars: 5, when: '2 days ago', text: 'The croissants arrived still slightly warm. I don’t understand how, and I don’t need to.' },
        { name: 'James T.', stars: 5, when: 'last week', text: 'Country sourdough every Saturday since spring. Crust like a drum.' },
        { name: 'Mina K.', stars: 4, when: '3 weeks ago', text: 'Cardamom knots sell out by 11, so order early. Worth the alarm.' },
      ],
    },
    {
      id: 'ring', name: 'Ring Theory', kind: 'Doughnut kitchen', cat: 'sweet',
      area: 'Dalston', street: '9 Ashwin Street, E8', est: 2019,
      owner: 'Theo Mensah', ownerRole: 'Fryer-in-chief',
      tagline: 'Brioche doughnuts, glazed to order and gone by mid-afternoon.',
      story: 'Theo fried his first batch for a supper club and never stopped. The dough proves overnight, the glazes change with the market and the jam is made in-house on Mondays.',
      quote: 'A doughnut should be eaten within four hours. We plan the whole day around that.',
      rating: 4.8, reviews: 932, dist: 0.9, eta: [25, 40], min: 6,
      hours: H.daily, tags: ['Vegan options'],
      color: '#D9577F', ink: '#FFF1F4', mono: 'RT', x: 420, y: 60,
      cover: IMG + 'cover/ring.webp', video: 'assets/video/ring.mp4', poster: IMG + 'poster/ring.webp',
      scene: IMG + 'p/ring-box.webp',
      pairs: ['ember', 'nib', 'crumb'],
      sections: [
        { name: 'Rings', items: [
          { id: 'sprinkle', name: 'Rainbow sprinkle ring', desc: 'Vanilla bean glaze, a defiant amount of sprinkles.', price: 3, unit: 'each', img: 'p/ring-sprinkle', badges: ['V'], tag: 'Bestseller', allergens: 'Gluten, milk, egg' },
          { id: 'nut', name: 'Hazelnut crunch', desc: 'Toasted hazelnut praline glaze with caramelised nut pieces.', price: 3.4, unit: 'each', img: 'p/ring-nut', badges: ['V'], allergens: 'Gluten, milk, egg, nuts' },
          { id: 'choc', name: 'Double chocolate', desc: 'Dark chocolate glaze and chocolate vermicelli. Nib & Bar 70%.', price: 3.4, unit: 'each', img: 'p/ring-choc', badges: ['V'], allergens: 'Gluten, milk, egg, soya' },
          { id: 'brown-butter', name: 'Brown butter & sea salt', desc: 'Nutty, salty, a little bit too good.', price: 3.6, unit: 'each', badges: ['V'], tag: 'New', allergens: 'Gluten, milk, egg' },
          { id: 'pumpkin', name: 'Spiced pumpkin custard', desc: 'Filled with roast pumpkin custard and dusted in cinnamon sugar.', price: 3.5, unit: 'each', badges: ['V'], tag: 'Seasonal', season: [9, 10], allergens: 'Gluten, milk, egg' },
        ] },
        { name: 'Boxes', items: [
          { id: 'box6', name: 'Box of six', desc: 'Two each of sprinkle, hazelnut and double chocolate.', price: 16, unit: 'box', img: 'p/ring-box', badges: ['V'], tag: 'Bestseller', allergens: 'Gluten, milk, egg, nuts, soya' },
          { id: 'box12', name: 'Party dozen', desc: 'Chef’s mix of the day. Please let us know about any allergies.', price: 30, unit: 'box', badges: ['V'], allergens: 'Gluten, milk, egg, nuts, soya' },
          { id: 'vegan4', name: 'Vegan four', desc: 'Oat-milk dough, coconut glaze. Nobody can tell.', price: 13.5, unit: 'box', badges: ['VG'], allergens: 'Gluten, soya' },
        ] },
      ],
      reviewList: [
        { name: 'Priya S.', stars: 5, when: 'yesterday', text: 'Ordered the box of six for the office. It lasted nine minutes.' },
        { name: 'Callum R.', stars: 5, when: '2 weeks ago', text: 'Brown butter one is the best thing I have eaten this year.' },
      ],
    },
    {
      id: 'rind', name: 'The Rind Room', kind: 'Cheesemonger', cat: 'cheese',
      area: 'London Fields', street: '72 Broadway Market, E8', est: 2011,
      owner: 'Inès Duarte', ownerRole: 'Affineur',
      tagline: 'Farmhouse cheese, cut to order and wrapped in waxed paper.',
      story: 'Inès ages her wheels in a converted railway arch where the temperature never moves. She buys direct from twenty small dairies and will happily tell you about every one of them.',
      quote: 'A cheese tastes of one field, one season and one cheesemaker. That is the whole point.',
      rating: 4.9, reviews: 761, dist: 0.4, eta: [20, 30], min: 8,
      hours: H.cheese, tags: ['Cut to order', 'Plastic-free'],
      color: '#E3B23C', ink: '#2A1F08', mono: 'RR', x: 300, y: 260,
      cover: IMG + 'cover/rind.webp', video: 'assets/video/rind.mp4', poster: IMG + 'poster/rind.webp',
      scene: IMG + 'scene/cheesemakers.webp',
      pairs: ['cellar', 'crumb', 'fiorella'],
      sections: [
        { name: 'From the counter', items: [
          { id: 'comte', name: 'Comté, 24 months', desc: 'Alpine, nutty and crystalline. Cut from a 40kg wheel the morning you order.', price: 8.4, unit: '200g', img: 'p/comte', tag: 'Bestseller', allergens: 'Milk' },
          { id: 'brie', name: 'Brie de Meaux', desc: 'Raw milk, mushroomy, ripe and ready for tonight.', price: 6.9, unit: '200g', allergens: 'Milk' },
          { id: 'cheddar', name: 'Cave-aged cheddar, grated', desc: 'Eighteen months in a Somerset cave. Grated fresh for gratins and toasties.', price: 4.2, unit: '200g', img: 'p/cheddar', allergens: 'Milk' },
          { id: 'burrata', name: 'Fresh burrata', desc: 'Made in Puglia on Tuesday, here by Thursday. Eat within two days.', price: 5.5, unit: '125g', badges: ['V'], allergens: 'Milk' },
          { id: 'manchego', name: 'Manchego, 12 months', desc: 'Sheep’s milk, firm and sweet with a peppery finish.', price: 7.2, unit: '200g', allergens: 'Milk' },
          { id: 'gorgonzola', name: 'Gorgonzola dolce', desc: 'Spoonable, gentle blue. Brilliant stirred into gnocchi.', price: 6.1, unit: '200g', badges: ['V'], allergens: 'Milk' },
        ] },
        { name: 'Boards & boxes', items: [
          { id: 'supper', name: 'Cheese & wine supper box', desc: 'Three cheeses, oatcakes, quince and a bottle picked by Low Cellar.', price: 38, unit: 'box', img: 'p/supper-box', tag: 'Bestseller', allergens: 'Milk, gluten, sulphites' },
          { id: 'board', name: 'Three-cheese starter board', desc: 'One soft, one hard, one blue. Feeds four as a starter.', price: 18, unit: 'board', allergens: 'Milk' },
        ] },
        { name: 'With cheese', items: [
          { id: 'quince', name: 'Quince paste', desc: 'Slow-cooked membrillo from Spanish quinces.', price: 4.5, unit: '200g', badges: ['VG'], allergens: '' },
          { id: 'oatcakes', name: 'Charcoal oatcakes', desc: 'Crisp, savoury and very black.', price: 3.4, unit: 'pack', badges: ['VG'], allergens: 'Oats (gluten)' },
          { id: 'chutney', name: 'Fig & walnut chutney', desc: 'Sticky, spiced and made for blue cheese.', price: 4.9, unit: 'jar', badges: ['VG'], allergens: 'Nuts, sulphites' },
        ] },
      ],
      reviewList: [
        { name: 'Hannah W.', stars: 5, when: '4 days ago', text: 'Asked for "something for a nervous blue cheese eater" in the notes and got the perfect gorgonzola plus a lovely handwritten card.' },
        { name: 'Dev P.', stars: 5, when: 'last week', text: 'The supper box is our Friday night now. The wine pairing was spot on.' },
      ],
    },
    {
      id: 'patch', name: 'Patch & Furrow', kind: 'Greengrocer', cat: 'grocer',
      area: 'Hackney Central', street: '18 Morning Lane, E9', est: 2016,
      owner: 'Dele Adeyemi', ownerRole: 'Grower & grocer',
      tagline: 'Fruit and veg from farms within 80 miles, picked this week.',
      story: 'Dele drives to six farms in Kent and Essex every Tuesday and Friday. If it is not in season, it is not on the shelf, and the chalkboard changes almost daily.',
      quote: 'We sell what the farms have, not what a spreadsheet says people want.',
      rating: 4.8, reviews: 1510, dist: 0.7, eta: [25, 35], min: 8,
      hours: H.long, tags: ['Organic', 'Zero-waste', 'Vegan'],
      color: '#2F6B52', ink: '#EAF5EC', mono: 'P&F', x: 540, y: 160,
      cover: IMG + 'cover/patch.webp', video: 'assets/video/patch.mp4', poster: IMG + 'poster/patch.webp',
      scene: IMG + 'scene/veg-board.webp',
      pairs: ['underwood', 'fiorella', 'saltline'],
      sections: [
        { name: 'In season now', items: [
          { id: 'squash', name: 'Autumn squash crate', desc: 'Delica, harlequin and crown prince. Roast, soup, repeat.', price: 9.5, unit: 'crate', img: 'p/squash', badges: ['VG', 'ORG'], tag: 'Seasonal', season: [8, 9, 10, 11], allergens: '' },
          { id: 'apples', name: 'Cox apples', desc: 'Crisp, aromatic and from a single Kent orchard.', price: 3.2, unit: '1kg', img: 'p/apples', badges: ['VG'], season: [8, 9, 10, 11], allergens: '' },
          { id: 'bramley', name: 'Bramley cooking apples', desc: 'For crumbles and sauces. Collapses into fluff.', price: 2.6, unit: '1kg', badges: ['VG'], season: [8, 9, 10, 11, 0], allergens: '' },
          { id: 'chestnuts', name: 'Sweet chestnuts', desc: 'Score, roast, peel, burn fingers. A rite of autumn.', price: 4.5, unit: '500g', badges: ['VG'], tag: 'Seasonal', season: [9, 10, 11], allergens: '' },
          { id: 'chard', name: 'Rainbow chard', desc: 'Bright stems, tender leaves, grown in Essex.', price: 2.4, unit: 'bunch', badges: ['VG', 'ORG'], season: [5, 6, 7, 8, 9, 10], allergens: '' },
        ] },
        { name: 'Everyday', items: [
          { id: 'tomatoes', name: 'Vine tomatoes', desc: 'The last of the glasshouse crop. Properly sweet.', price: 3.2, unit: '500g', img: 'p/tomatoes', badges: ['VG'], season: [5, 6, 7, 8, 9], allergens: '' },
          { id: 'blueberries', name: 'Blueberries', desc: 'Firm, dusty-blue and perfect for porridge.', price: 3.5, unit: '250g', img: 'p/blueberries', badges: ['VG'], allergens: '' },
          { id: 'strawberries', name: 'Late-season strawberries', desc: 'Everbearers from a tunnel in Kent. Not long left.', price: 4, unit: '400g', img: 'p/strawberries', badges: ['VG'], tag: 'Limited', season: [5, 6, 7, 8, 9], allergens: '' },
          { id: 'greens', name: 'Green bundle', desc: 'Cavolo nero, flat parsley, dill and a frilly lettuce.', price: 6, unit: 'bundle', img: 'p/greens', badges: ['VG', 'ORG'], allergens: '' },
          { id: 'leeks', name: 'Leeks', desc: 'Long, white and muddy in the right way.', price: 2.1, unit: '× 3', badges: ['VG'], allergens: '' },
        ] },
        { name: 'Boxes', items: [
          { id: 'vegbox', name: 'Rainbow veg box', desc: 'Enough for a week of dinners for two. Recipe card included.', price: 18, unit: 'box', img: 'p/veg-box', badges: ['VG', 'ORG'], tag: 'Bestseller', allergens: '' },
          { id: 'fruitbox', name: 'Fruit bowl box', desc: 'Apples, pears, citrus and whatever looks best at the farm.', price: 15, unit: 'box', badges: ['VG'], allergens: '' },
        ] },
      ],
      reviewList: [
        { name: 'Tom E.', stars: 5, when: '3 days ago', text: 'Best tomatoes I have had in London. They actually smell of tomato.' },
        { name: 'Aisha N.', stars: 5, when: '2 weeks ago', text: 'Veg box plus the recipe card has fixed my Sunday meal planning.' },
        { name: 'Ruth M.', stars: 4, when: 'a month ago', text: 'Substituted kale for chard without asking, but it was lovely kale.' },
      ],
    },
    {
      id: 'saltline', name: 'Saltline', kind: 'Fishmonger', cat: 'fish',
      area: 'Well Street', street: '113 Well Street, E9', est: 2009,
      owner: 'Rosa Kowalczyk', ownerRole: 'Fishmonger',
      tagline: 'Day-boat fish from Cornwall and Devon, on the slab by 8am.',
      story: 'Rosa buys straight off the boats at Newlyn and Brixham. Whatever landed yesterday is on today’s slab, and she will scale, gut and fillet it however you like.',
      quote: 'If you tell me what you are cooking, I will tell you what to buy. That is the job.',
      rating: 4.9, reviews: 688, dist: 1.1, eta: [30, 40], min: 10,
      hours: H.fish, tags: ['MSC certified', 'Prepared to order'],
      color: '#2B5D7C', ink: '#E8F3F8', mono: 'SL', x: 660, y: 260,
      cover: IMG + 'cover/saltline.webp', video: 'assets/video/saltline.mp4', poster: IMG + 'poster/saltline.webp',
      scene: IMG + 'scene/fish-seller.webp',
      pairs: ['cellar', 'patch', 'saffron'],
      sections: [
        { name: 'On the slab', items: [
          { id: 'seabass', name: 'Whole sea bass', desc: 'Line-caught off Cornwall. Scaled and gutted unless you say otherwise.', price: 9.8, unit: '~600g', img: 'p/sea-bass', badges: ['GF'], tag: 'Bestseller', allergens: 'Fish' },
          { id: 'mackerel', name: 'Mackerel', desc: 'Silver, oily, cheap and brilliant on a hot grill.', price: 6, unit: '× 2', img: 'p/mackerel', badges: ['GF'], allergens: 'Fish' },
          { id: 'salmon', name: 'Organic salmon side', desc: 'From a Shetland farm with low stocking densities. Pin-boned.', price: 24, unit: '~1kg', img: 'p/salmon', badges: ['GF'], allergens: 'Fish' },
          { id: 'hake', name: 'Hake fillets', desc: 'Skin-on, from the Brixham boats. Flakes like a dream.', price: 11.5, unit: '× 2', badges: ['GF'], allergens: 'Fish' },
          { id: 'mussels', name: 'Rope-grown mussels', desc: 'Cleaned and debearded. Wine and shallots not included (try Low Cellar).', price: 6.5, unit: '1kg', badges: ['GF'], season: [9, 10, 11, 0, 1, 2], allergens: 'Molluscs' },
        ] },
        { name: 'Shellfish', items: [
          { id: 'crab', name: 'Brown crab, cooked', desc: 'Dressed or whole. Sweet white meat and rich brown meat.', price: 14, unit: 'each', img: 'p/crab', badges: ['GF'], tag: 'Seasonal', season: [3, 4, 5, 6, 7, 8, 9, 10], allergens: 'Crustaceans' },
          { id: 'prawns', name: 'Raw king prawns', desc: 'Shell-on, responsibly farmed in Madagascar.', price: 10.5, unit: '300g', badges: ['GF'], allergens: 'Crustaceans' },
          { id: 'oysters', name: 'Native oysters', desc: 'Only when there is an R in the month. Shucking knife on request.', price: 15, unit: '× 6', badges: ['GF'], tag: 'Limited', season: [8, 9, 10, 11, 0, 1, 2, 3], allergens: 'Molluscs' },
        ] },
        { name: 'Smokehouse', items: [
          { id: 'haddock', name: 'Undyed smoked haddock', desc: 'For kedgeree, chowder and Sunday brunch.', price: 7.2, unit: '300g', badges: ['GF'], allergens: 'Fish' },
          { id: 'trout', name: 'Hot-smoked trout', desc: 'Flaky and gently smoky. Lovely with horseradish.', price: 6.4, unit: '200g', badges: ['GF'], allergens: 'Fish' },
        ] },
      ],
      reviewList: [
        { name: 'Marco D.', stars: 5, when: '5 days ago', text: 'Asked for the sea bass butterflied for the barbecue. Perfect job, came with a lemon.' },
        { name: 'Sophie L.', stars: 5, when: '3 weeks ago', text: 'Freshest fish I have bought outside of the coast. Crab was sweet as anything.' },
      ],
    },
    {
      id: 'saffron', name: 'Saffron & Sack', kind: 'Spice merchant', cat: 'pantry',
      area: 'Dalston', street: '204 Kingsland Road, E2', est: 2018,
      owner: 'Yusuf Demir', ownerRole: 'Blender',
      tagline: 'Whole spices, house blends and dried flowers, ground weekly.',
      story: 'Yusuf grew up above his grandfather’s spice stall in Gaziantep. He imports whole, grinds in small batches every Monday and labels every jar with the date it was milled.',
      quote: 'Ground spice loses its voice in a month. Ours is never older than a week.',
      rating: 4.8, reviews: 402, dist: 0.8, eta: [25, 35], min: 6,
      hours: H.long, tags: ['Ground weekly', 'Refills'],
      color: '#B4432A', ink: '#FFEFE6', mono: 'S&S', x: 180, y: 360,
      cover: IMG + 'cover/saffron.webp', video: 'assets/video/saffron.mp4', poster: IMG + 'poster/saffron.webp',
      scene: IMG + 'p/spice-sacks.webp',
      pairs: ['patch', 'saltline', 'fiorella'],
      sections: [
        { name: 'House blends', items: [
          { id: 'spicebox', name: 'Spice market box', desc: 'Six jars: za’atar, sumac, baharat, Aleppo chilli, ras el hanout, smoked paprika.', price: 22, unit: 'box', img: 'p/spice-box', badges: ['VG'], tag: 'Bestseller', allergens: 'Sesame' },
          { id: 'zaatar', name: 'Za’atar', desc: 'Wild thyme, toasted sesame and sumac. Olive oil and bread required.', price: 4.2, unit: '60g', badges: ['VG'], allergens: 'Sesame' },
          { id: 'ras', name: 'Ras el hanout', desc: 'Twenty-two spices and dried rose. Warm, floral, complex.', price: 4.8, unit: '60g', badges: ['VG'], allergens: '' },
          { id: 'baharat', name: 'Baharat', desc: 'Black pepper, allspice and cinnamon. For lamb, rice and roast veg.', price: 4.5, unit: '60g', badges: ['VG'], allergens: '' },
        ] },
        { name: 'Single spices & flowers', items: [
          { id: 'rose', name: 'Damask rose buds', desc: 'Whole buds for tea, baking and very pretty rice.', price: 5.2, unit: '40g', img: 'p/rose-buds', badges: ['VG'], allergens: '' },
          { id: 'sampler', name: 'Whole spice sampler', desc: 'Cumin, coriander, fennel, cardamom, cloves and star anise in cotton sacks.', price: 12, unit: 'set', img: 'p/spice-sacks', badges: ['VG'], allergens: '' },
          { id: 'saffron-threads', name: 'Saffron threads', desc: 'Grade 1 negin from Khorasan. A pinch goes a long way.', price: 7.5, unit: '1g', badges: ['VG'], tag: 'Bestseller', allergens: '' },
          { id: 'paprika', name: 'Smoked paprika', desc: 'Oak-smoked, sweet pimientón from Extremadura.', price: 3.6, unit: '70g', badges: ['VG'], allergens: '' },
          { id: 'aleppo', name: 'Aleppo chilli flakes', desc: 'Fruity, oily and only gently hot.', price: 4.2, unit: '50g', badges: ['VG'], allergens: '' },
        ] },
      ],
      reviewList: [
        { name: 'Fatima A.', stars: 5, when: 'last week', text: 'The za’atar is so fresh it is almost green. Ruined supermarket spice for me.' },
        { name: 'George H.', stars: 5, when: '2 weeks ago', text: 'Bought the market box as a gift and then immediately bought one for myself.' },
      ],
    },
    {
      id: 'underwood', name: 'Underwood', kind: 'Wild mushrooms', cat: 'grocer',
      area: 'Homerton', street: 'Arch 6, Homerton Road, E9', est: 2020,
      owner: 'Ciarán Byrne', ownerRole: 'Forager',
      tagline: 'Foraged and small-farm mushrooms, out of the woods yesterday.',
      story: 'Ciarán forages under licence in Sussex and the New Forest from August to November, and grows oyster and lion’s mane in a basement under the arches for the rest of the year.',
      quote: 'Autumn is short. When the chanterelles come up, we drop everything.',
      rating: 4.9, reviews: 318, dist: 1.3, eta: [30, 45], min: 8,
      hours: H.shop, tags: ['Foraged', 'Seasonal'],
      color: '#8A5A2B', ink: '#FFF3E4', mono: 'UW', x: 60, y: 460,
      cover: IMG + 'cover/underwood.webp', video: 'assets/video/underwood.mp4', poster: IMG + 'poster/underwood.webp',
      scene: IMG + 'scene/forager.webp',
      pairs: ['fiorella', 'rind', 'cellar'],
      sections: [
        { name: 'This week’s forage', items: [
          { id: 'chanterelles', name: 'Golden chanterelles', desc: 'Apricot-scented and firm. Fry hot in butter with nothing else.', price: 9.5, unit: '250g', img: 'p/chanterelles', badges: ['VG'], tag: 'Seasonal', season: [7, 8, 9, 10], allergens: '' },
          { id: 'porcini', name: 'Porcini (ceps)', desc: 'Fat, firm caps from the New Forest. The king of the woods.', price: 14, unit: '250g', img: 'p/porcini', badges: ['VG'], tag: 'Limited', season: [8, 9, 10], allergens: '' },
          { id: 'hen', name: 'Hen of the woods', desc: 'Frilly maitake clusters that roast up crisp and meaty.', price: 11, unit: '250g', badges: ['VG'], tag: 'Seasonal', season: [8, 9, 10], allergens: '' },
          { id: 'wildmix', name: 'Wild basket', desc: 'Whatever was best in the woods this week, about five varieties.', price: 16, unit: '500g', badges: ['VG'], season: [7, 8, 9, 10], allergens: '' },
        ] },
        { name: 'Grown under the arches', items: [
          { id: 'buttons', name: 'Chestnut buttons', desc: 'Small, white and firm. The everyday mushroom done properly.', price: 2.4, unit: '400g', img: 'p/buttons', badges: ['VG'], allergens: '' },
          { id: 'oyster', name: 'Grey oyster', desc: 'Tender, peppery fans. Tear, never chop.', price: 3.8, unit: '200g', badges: ['VG'], allergens: '' },
          { id: 'lions', name: 'Lion’s mane', desc: 'Shaggy and white, with a texture like crab. Sear in slabs.', price: 6.5, unit: '200g', badges: ['VG'], tag: 'New', allergens: '' },
        ] },
        { name: 'Pantry', items: [
          { id: 'morels', name: 'Dried morels', desc: 'Smoky, honeycombed and wildly intense. Soak for twenty minutes.', price: 9, unit: '20g', badges: ['VG'], allergens: '' },
          { id: 'pesto', name: 'Wild garlic pesto', desc: 'Spring’s ramsons, preserved in oil with toasted hazelnuts.', price: 6.2, unit: 'jar', badges: ['VG'], allergens: 'Nuts' },
        ] },
      ],
      reviewList: [
        { name: 'Nina F.', stars: 5, when: '2 days ago', text: 'Chanterelles on toast with Crumb & Kiln sourdough. A very good Tuesday.' },
        { name: 'Owen G.', stars: 5, when: 'last week', text: 'Ciarán added a note explaining how to clean the porcini. Small thing, big difference.' },
      ],
    },
    {
      id: 'hive', name: 'Hive & Hollow', kind: 'Honey & beeswax', cat: 'pantry',
      area: 'Hackney Wick', street: 'Unit 4, Queen’s Yard, E9', est: 2015,
      owner: 'Lena Varga', ownerRole: 'Beekeeper',
      tagline: 'Raw honey from 40 hives on east London rooftops and Essex meadows.',
      story: 'Lena keeps bees on rooftops from Hackney Wick to Walthamstow and in two meadows in Essex. Each jar is labelled with the postcode the bees foraged in.',
      quote: 'City honey tastes of lime trees and back gardens. Every street is a little different.',
      rating: 4.9, reviews: 274, dist: 1.4, eta: [30, 45], min: 6,
      hours: H.shop, tags: ['Raw', 'Local'],
      color: '#D89A1E', ink: '#2A1C03', mono: 'H&H', x: 780, y: 160,
      cover: IMG + 'cover/hive.webp', video: 'assets/video/hive.mp4', poster: IMG + 'poster/hive.webp',
      scene: IMG + 'scene/hive.webp',
      pairs: ['crumb', 'rind', 'ember'],
      sections: [
        { name: 'Honey', items: [
          { id: 'wildflower', name: 'Raw wildflower honey', desc: 'Unheated and unfiltered, from the E9 rooftop hives.', price: 8.5, unit: '340g', img: 'p/honey', badges: ['V'], tag: 'Bestseller', allergens: '' },
          { id: 'heather', name: 'Heather honey', desc: 'Thick, jelly-like and toffee-dark, from late summer moorland.', price: 11, unit: '227g', img: 'p/heather-honey', badges: ['V'], tag: 'Seasonal', season: [8, 9, 10, 11], allergens: '' },
          { id: 'comb', name: 'Cut comb', desc: 'Straight from the frame. Spread it on toast, wax and all.', price: 12.5, unit: '200g', badges: ['V'], allergens: '' },
          { id: 'creamed', name: 'Creamed borage honey', desc: 'Whipped smooth and soft-set. Children love it.', price: 7.8, unit: '227g', badges: ['V'], allergens: '' },
          { id: 'hot', name: 'Chilli honey', desc: 'Infused with Aleppo chilli from Saffron & Sack. For pizza and fried chicken.', price: 6.9, unit: '227g', badges: ['V'], tag: 'New', allergens: '' },
        ] },
        { name: 'From the hive', items: [
          { id: 'candle', name: 'Beeswax pillar candle', desc: 'Hand-poured, smells faintly of honey, burns for 40 hours.', price: 14, unit: 'each', allergens: '' },
          { id: 'pollen', name: 'Bee pollen', desc: 'Sweet, floral granules for yoghurt and smoothies.', price: 6.5, unit: '100g', badges: ['V'], allergens: 'Pollen' },
        ] },
      ],
      reviewList: [
        { name: 'Ellie C.', stars: 5, when: 'last week', text: 'Heather honey is unreal. Like toffee and flowers had a baby.' },
        { name: 'Rahul V.', stars: 5, when: 'a month ago', text: 'Love that the jar says which postcode the bees were in.' },
      ],
    },
    {
      id: 'nib', name: 'Nib & Bar', kind: 'Chocolate makers', cat: 'sweet',
      area: 'Clapton', street: '6 Powerscroft Road, E5', est: 2017,
      owner: 'Sofia Marchetti', ownerRole: 'Chocolate maker',
      tagline: 'Bean-to-bar chocolate, roasted and conched in the back room.',
      story: 'Sofia buys cacao directly from three co-operatives in Peru, Tanzania and Belize, roasts it in a converted coffee roaster and pours every bar by hand.',
      quote: 'Two ingredients, cacao and sugar. Everything else is time and patience.',
      rating: 4.8, reviews: 356, dist: 0.7, eta: [25, 35], min: 6,
      hours: H.daily, tags: ['Bean to bar', 'Vegan options'],
      color: '#5A2E22', ink: '#F8E7DA', mono: 'N&B', x: 300, y: 60,
      cover: IMG + 'cover/nib.webp', video: 'assets/video/nib.mp4', poster: IMG + 'poster/nib.webp',
      scene: IMG + 'p/chunks.webp',
      pairs: ['ember', 'cellar', 'ring'],
      sections: [
        { name: 'Bars', items: [
          { id: 'bar70', name: '70% single origin', desc: 'Peruvian cacao: red fruit, cocoa and a long, clean finish.', price: 6.5, unit: '70g', img: 'p/bar', badges: ['VG'], tag: 'Bestseller', allergens: 'May contain milk, nuts' },
          { id: 'saltnib', name: 'Sea salt & nib, 60%', desc: 'Crunchy roasted nibs and Cornish sea salt.', price: 6.2, unit: '70g', badges: ['VG'], allergens: 'May contain milk, nuts' },
          { id: 'gianduja', name: 'Hazelnut gianduja', desc: 'Piedmont hazelnuts ground silky into milk chocolate.', price: 6.8, unit: '70g', badges: ['V'], allergens: 'Milk, nuts' },
          { id: 'almonds', name: 'Milk chocolate almonds', desc: 'Roasted Valencia almonds, panned in 45% milk chocolate.', price: 5.8, unit: '150g', img: 'p/almonds', badges: ['V'], allergens: 'Milk, nuts' },
        ] },
        { name: 'Bake & drink', items: [
          { id: 'chunks', name: 'Baking chunks, 65%', desc: 'Rough-cut offcuts for cookies, brownies and the cook.', price: 7.2, unit: '400g', img: 'p/chunks', badges: ['VG'], allergens: 'May contain milk, nuts' },
          { id: 'hotchoc', name: 'Hot chocolate flakes', desc: 'Shaved 55% chocolate. Whisk into hot milk.', price: 9, unit: '250g', badges: ['V'], allergens: 'May contain milk, nuts' },
          { id: 'granola', name: 'Cocoa nib granola', desc: 'Oats, nibs, toasted coconut and a little Hive & Hollow honey.', price: 7.5, unit: '400g', badges: ['V'], tag: 'New', allergens: 'Oats (gluten)' },
        ] },
      ],
      reviewList: [
        { name: 'Laura J.', stars: 5, when: '3 days ago', text: 'The 70% bar tastes of raspberries. How?!' },
        { name: 'Kwame O.', stars: 4, when: '2 weeks ago', text: 'Baking chunks made the best cookies of my life. Wish the bag was bigger.' },
      ],
    },
    {
      id: 'ember', name: 'Ember Roasters', kind: 'Coffee roastery', cat: 'drinks',
      area: 'Hackney Downs', street: '3 Amhurst Terrace, E8', est: 2013,
      owner: 'Kemi Afolabi', ownerRole: 'Head roaster',
      tagline: 'Small-batch coffee, roasted Tuesday and Friday, sent out within days.',
      story: 'Kemi roasts on a 15kg drum in a former printworks. Every bag carries a roast date and a brewing recipe, and the filter of the month rotates through small farms she has visited.',
      quote: 'Fresh roasted, rested a few days, then brewed within a month. That is the window.',
      rating: 4.8, reviews: 645, dist: 1.0, eta: [25, 40], min: 6,
      hours: H.coffee, tags: ['Direct trade', 'Roasted weekly'],
      color: '#26211D', ink: '#F4E7D6', mono: 'ER', x: 660, y: 460,
      cover: IMG + 'cover/ember.webp', video: 'assets/video/ember.mp4', poster: IMG + 'poster/ember.webp',
      scene: IMG + 'p/house-blend.webp',
      pairs: ['crumb', 'ring', 'nib'],
      sections: [
        { name: 'Beans', items: [
          { id: 'espresso', name: 'Hillside espresso', desc: 'Brazil and Colombia. Milk chocolate, hazelnut, brown sugar.', price: 9.5, unit: '250g', img: 'p/beans', badges: ['VG'], tag: 'Bestseller', allergens: '' },
          { id: 'filter', name: 'Filter of the month: Guji, Ethiopia', desc: 'Washed heirloom varieties. Bergamot, peach, black tea.', price: 11, unit: '250g', img: 'p/filter', badges: ['VG'], tag: 'New', allergens: '' },
          { id: 'house', name: 'House blend', desc: 'The everyday one. Smooth, sweet and forgiving in any brewer.', price: 32, unit: '1kg', img: 'p/house-blend', badges: ['VG'], allergens: '' },
          { id: 'decaf', name: 'Swiss water decaf', desc: 'Chemical-free decaf that still tastes like coffee.', price: 9.8, unit: '250g', badges: ['VG'], allergens: '' },
        ] },
        { name: 'Brew', items: [
          { id: 'coldbrew', name: 'Cold brew concentrate', desc: 'Steeped for 18 hours. Dilute 1:2 with milk or water.', price: 7.5, unit: '500ml', badges: ['VG'], allergens: '' },
          { id: 'filters', name: 'Paper filters', desc: 'Unbleached cone filters, size 02.', price: 5, unit: '× 100', allergens: '' },
        ] },
      ],
      reviewList: [
        { name: 'Ben A.', stars: 5, when: 'yesterday', text: 'Roast date was three days before delivery. Espresso is chocolatey and dreamy.' },
        { name: 'Yuki T.', stars: 5, when: 'last week', text: 'The Guji is like drinking peach iced tea. Brilliant.' },
      ],
    },
    {
      id: 'cellar', name: 'Low Cellar', kind: 'Natural wine shop', cat: 'drinks',
      area: 'Dalston', street: '27 Stoke Newington Road, N16', est: 2018,
      owner: 'Felix Arndt', ownerRole: 'Wine buyer',
      tagline: 'Low-intervention wine from small growers, chilled and ready.',
      story: 'Felix spent a decade in restaurant cellars before opening a shop the size of a large cupboard. Around 300 bottles, most under £25, all from growers he can name.',
      quote: 'Tell me what you are eating and what you liked last time. I will find the bottle.',
      rating: 4.9, reviews: 587, dist: 0.5, eta: [20, 30], min: 12,
      hours: H.wine, tags: ['18+', 'Chilled bottles'],
      color: '#7A1F35', ink: '#FCE9EE', mono: 'LC', x: 300, y: 460,
      cover: IMG + 'cover/cellar.webp', video: 'assets/video/cellar.mp4', poster: IMG + 'poster/cellar.webp',
      scene: IMG + 'scene/wine-shop.webp',
      pairs: ['rind', 'saltline', 'fiorella'],
      sections: [
        { name: 'Reds', items: [
          { id: 'gamay', name: 'Gamay, Beaujolais 2024', desc: 'Light, crunchy and juicy. Serve it slightly chilled.', price: 16, unit: '75cl', img: 'p/gamay', badges: ['VG', 'ORG'], tag: 'Bestseller', allergens: 'Sulphites' },
          { id: 'grenache', name: 'Old-vine Grenache 2022', desc: 'Ninety-year-old vines in Roussillon. Dark cherry and garrigue.', price: 19, unit: '75cl', img: 'p/grenache', badges: ['VG'], allergens: 'Sulphites' },
          { id: 'frappato', name: 'Frappato, Sicily 2024', desc: 'Strawberries, rose petals and a little spice.', price: 17.5, unit: '75cl', badges: ['VG', 'ORG'], allergens: 'Sulphites' },
        ] },
        { name: 'Whites & orange', items: [
          { id: 'skin', name: 'Skin-contact Pinot Grigio', desc: 'Copper-coloured, apricot and tea-like. A great food wine.', price: 18, unit: '75cl', badges: ['VG', 'ORG'], tag: 'New', allergens: 'Sulphites' },
          { id: 'chenin', name: 'Chenin Blanc, Loire 2023', desc: 'Quince, honey and electric acidity. Brilliant with fish.', price: 21, unit: '75cl', badges: ['VG'], allergens: 'Sulphites' },
          { id: 'gruner', name: 'Grüner Veltliner, litre', desc: 'Peppery, zesty and comes in a party-sized bottle.', price: 15, unit: '1L', badges: ['VG'], allergens: 'Sulphites' },
        ] },
        { name: 'Fizz', items: [
          { id: 'petnat', name: 'Pet-nat rosé', desc: 'Cloudy, gently fizzy and full of red fruit.', price: 20, unit: '75cl', badges: ['VG', 'ORG'], allergens: 'Sulphites' },
          { id: 'cremant', name: 'Crémant de Loire', desc: 'Champagne method at half the price.', price: 23, unit: '75cl', badges: ['VG'], allergens: 'Sulphites' },
        ] },
      ],
      reviewList: [
        { name: 'Chloe P.', stars: 5, when: '4 days ago', text: 'Wrote "fish stew, under £20" in the notes. Felix sent the Chenin with a little card. Perfect.' },
        { name: 'Sam O.', stars: 5, when: '3 weeks ago', text: 'Arrived properly chilled. ID check at the door was quick and friendly.' },
      ],
    },
    {
      id: 'fiorella', name: 'Fiorella', kind: 'Italian deli', cat: 'pantry',
      area: 'Broadway Market', street: '15 Broadway Market, E8', est: 2012,
      owner: 'Giulia Ferraro', ownerRole: 'Pasta maker',
      tagline: 'Fresh pasta rolled every morning, plus a proper Italian larder.',
      story: 'Giulia rolls pasta in the shop window from 7am using her nonna’s method: 00 flour, bright-yolked eggs and a very long wooden pin. The shelves behind her hold the things she could not find in London.',
      quote: 'Fresh pasta needs three minutes in the pot and nothing complicated on top.',
      rating: 4.8, reviews: 893, dist: 0.6, eta: [25, 35], min: 8,
      hours: H.long, tags: ['Made daily', 'Vegetarian'],
      color: '#6B7A2A', ink: '#F4F6E4', mono: 'Fi', x: 540, y: 560,
      cover: IMG + 'cover/fiorella.webp', video: 'assets/video/fiorella.mp4', poster: IMG + 'poster/fiorella.webp',
      scene: IMG + 'scene/pasta-hands.webp',
      pairs: ['cellar', 'underwood', 'rind'],
      sections: [
        { name: 'Fresh pasta', items: [
          { id: 'tagliatelle', name: 'Egg tagliatelle', desc: 'Rolled this morning. Three minutes in salted water.', price: 5.2, unit: '400g', img: 'p/tagliatelle', badges: ['V'], tag: 'Bestseller', allergens: 'Gluten, egg' },
          { id: 'kit', name: 'Pasta night for two', desc: 'Tagliatelle, a jar of slow ragù, Parmigiano and a bunch of basil.', price: 14, unit: 'kit', img: 'p/pasta-kit', allergens: 'Gluten, egg, milk, celery' },
          { id: 'ravioli', name: 'Pumpkin & sage ravioli', desc: 'Roast squash, amaretti and brown butter-ready.', price: 6.8, unit: '250g', badges: ['V'], tag: 'Seasonal', season: [8, 9, 10, 11], allergens: 'Gluten, egg, milk, nuts' },
          { id: 'gnocchi', name: 'Potato gnocchi', desc: 'Light as anything. Pan-fry them until golden.', price: 4.6, unit: '500g', badges: ['V'], allergens: 'Gluten, egg' },
        ] },
        { name: 'Larder', items: [
          { id: 'eggs', name: 'Free-range eggs', desc: 'Orange-yolked Burford Browns from a Suffolk farm.', price: 3.4, unit: '× 6', img: 'p/eggs', badges: ['V'], allergens: 'Egg' },
          { id: 'parm', name: 'Parmigiano Reggiano, 24 months', desc: 'From a single dairy in the hills above Parma.', price: 7.9, unit: '200g', allergens: 'Milk' },
          { id: 'sanmarzano', name: 'San Marzano tomatoes', desc: 'DOP, grown in volcanic soil. The base of every good sauce.', price: 3.2, unit: '400g', badges: ['VG'], allergens: '' },
          { id: 'olives', name: 'Nocellara olives', desc: 'Bright green, buttery and mild.', price: 4.4, unit: '200g', badges: ['VG'], allergens: '' },
          { id: 'oil', name: 'Extra virgin olive oil', desc: 'New-season Sicilian oil, peppery and green.', price: 12, unit: '500ml', badges: ['VG'], allergens: '' },
        ] },
      ],
      reviewList: [
        { name: 'Elena R.', stars: 5, when: '2 days ago', text: 'As close to my grandmother’s tagliatelle as I have found in London.' },
        { name: 'Joe K.', stars: 5, when: 'last week', text: 'Pasta night kit is dinner sorted in ten minutes and it feels fancy.' },
      ],
    },
  ];

  // flatten products for search, quick view and cart
  const products = {};
  shops.forEach(s => s.sections.forEach(sec => sec.items.forEach(it => {
    it.key = s.id + ':' + it.id;
    it.shop = s.id;
    it.section = sec.name;
    if (it.img && !it.img.startsWith('assets')) it.img = IMG + it.img + '.webp';
    products[it.key] = it;
  })));

  window.LARDER = {
    currency: '£',
    deliveryFee: 3.49,
    freeOver: 45,
    serviceFee: 0.99,
    home: { x: 420, y: 360, label: 'You', postcode: 'E8 3PH' },
    hub: { x: 60, y: 160 },
    categories, shops, products,
  };
})();
