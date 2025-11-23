const { mongoose, Product } = require("./db");

const productCatalog = [
  {
    slug: "calc-made-easy",
    name: "Calculus Made Easy (3rd Ed.)",
    price: 29.5,
    shortDescription:
      "Lightly highlighted copy of Thompson & Gardner's classic reference. Perfect for MAT301 and MAT302.",
    description:
      "Ships with the laminated formula card and a handful of professor notes tucked inside the back cover. Pages are clean, binding is tight, and only 12 pages contain pencil annotations that can be erased.",
    headline: "A step-by-step refresher for STEM majors",
    specs: [
      "Author: Silvanus P. Thompson & Martin Gardner",
      "ISBN: 978-1259586130",
      "Condition: Good (minor pencil notes)",
      "Format: Paperback, includes formula card",
    ],
    image:
      "https://m.media-amazon.com/images/I/410KfWepEFL._AC_UF1000,1000_QL80_.jpg",
  },
  {
    slug: "psych-exploration",
    name: "Psychology: An Exploration (4th Ed.)",
    price: 42.0,
    shortDescription:
      "Used in PSY 100 at BMCC. Includes untouched MyLab access code still sealed in the sleeve.",
    description:
      "Cover shows slight shelf wear, but the interior is pristine. Great option if you want the latest DSM-5 updates without paying bookstore pricing.",
    headline: "Everything you need for Intro to Psychology",
    specs: [
      "Author: Saundra Ciccarelli & J. Noland White",
      "ISBN: 978-0134636850",
      "Condition: Very Good",
      "Bonus: Unused MyLab code included",
    ],
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIjCInaE148oimdx5nUC1G61Kl_cZBN6D6TQ&s",
  },
  {
    slug: "python-workshop",
    name: "Python Crash Course (2nd Ed.)",
    price: 25.75,
    shortDescription:
      "Ideal for CSC 101 lab sections. Code samples are flagged with sticky notes for quick reference.",
    description:
      "Well-kept paperback with no coffee stains or loose pages. Comes with a printed cheat sheet of common terminal commands created by the previous owner.",
    headline: "Kick-start your first programming portfolio",
    specs: [
      "Author: Eric Matthes",
      "ISBN: 978-1593279288",
      "Condition: Excellent",
      "Extras: Laminated quick reference sheet",
    ],
    image:
      "https://m.media-amazon.com/images/I/71pys4B4OVL._AC_UF1000,1000_QL80_.jpg",
  },
  {
    slug: "human-anatomy",
    name: "Human Anatomy & Physiology (11th Ed.)",
    price: 68.0,
    shortDescription:
      "Required for BIO 425. Comes with a lightly used lab manual and intact diagrams.",
    description:
      "Spiral binding is still sturdy, tabs have been added for each body system, and the lab manual only has two completed exercises.",
    headline: "Study-ready visuals for pre-nursing tracks",
    specs: [
      "Author: Elaine N. Marieb & Katja Hoehn",
      "ISBN: 978-0134580993",
      "Condition: Very Good",
      "Includes: Lab manual + tab set",
    ],
    image:
      "https://m.media-amazon.com/images/I/81bIGIKwOML._AC_UF1000,1000_QL80_.jpg",
  },
  {
    slug: "public-speaking",
    name: "The Art of Public Speaking (13th Ed.)",
    price: 19.25,
    shortDescription:
      "Helpful for SPE 100. Margin notes emphasize delivery tips from Professor Singh's lectures.",
    description:
      "Sticker residue on the cover, otherwise in solid shape. Includes a printed rubric template to guide practice speeches.",
    headline: "Confidence-building tips from a fellow Bearcat",
    specs: [
      "Author: Stephen Lucas",
      "ISBN: 978-1260412932",
      "Condition: Good",
      "Bonus: Speech outline template",
    ],
    image:
      "https://m.media-amazon.com/images/I/81qt2t60JbL._AC_UF1000,1000_QL80_.jpg",
  },
];

(async () => {
  try {
    await Product.deleteMany({});
    await Product.insertMany(productCatalog);
    console.log("Seeded products collection.");
  } catch (error) {
    console.error("Seeding failed", error);
  } finally {
    mongoose.connection.close();
  }
})();
