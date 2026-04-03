const locations = [
  {
    name: "Gamatech Tunis Center",
    address: "15 Avenue Habib Bourguiba",
    city: "Tunis",
    phone: "+216 71 234 567",
    hours: "Lun - Sam: 09:00 - 19:00",
  },
  {
    name: "Gamatech Sousse Mall",
    address: "Zone Touristique, Route de la Plage",
    city: "Sousse",
    phone: "+216 73 456 780",
    hours: "Lun - Sam: 10:00 - 20:00",
  },
  {
    name: "Gamatech Sfax Hub",
    address: "12 Rue de la Liberté",
    city: "Sfax",
    phone: "+216 74 567 890",
    hours: "Lun - Sam: 09:00 - 18:30",
  },
];

const collaborators = [
  {
    name: "Ahmed Ben Salem",
    role: "Directeur Boutique",
    location: "Tunis",
    email: "ahmed@gamatech.tn",
  },
  {
    name: "Sara Kefi",
    role: "Responsable Produits",
    location: "Sousse",
    email: "sara@gamatech.tn",
  },
  {
    name: "Youssef Trabelsi",
    role: "Support Client",
    location: "Sfax",
    email: "support@gamatech.tn",
  },
  {
    name: "Rania Gharbi",
    role: "Marketing & Réseaux",
    location: "Tunis",
    email: "marketing@gamatech.tn",
  },
];

const About = () => {
  return (
    <section className="min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">About Gamatech</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-3">
            Votre univers gaming, partout en Tunisie
          </h1>
          <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
            Gamatech rassemble des passionnés de gaming et de high-tech. Nous proposons les meilleurs équipements,
            un accompagnement personnalisé, et un service après-vente réactif pour chaque joueur.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { label: "Années d'expertise", value: "8+" },
            { label: "Commandes livrées", value: "12k+" },
            { label: "Collaborateurs", value: "35+" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-2xl border border-border p-6 text-center">
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
          <div className="bg-card rounded-2xl border border-border p-8">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-3">Notre mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              Offrir des produits fiables, des configurations sur mesure et des conseils d'experts pour améliorer
              votre expérience gaming. Nous travaillons avec les meilleures marques pour garantir performance et durabilité.
            </p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-8">
            <h2 className="font-display text-2xl font-semibold text-foreground mb-3">Notre histoire</h2>
            <p className="text-muted-foreground leading-relaxed">
              Depuis 2018, Gamatech accompagne les joueurs tunisiens avec des boutiques proches de vous. Notre équipe
              grandit grâce à la confiance de notre communauté.
            </p>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-6">Nos magasins</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {locations.map((loc) => (
              <div key={loc.name} className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-display font-semibold text-foreground">{loc.name}</h3>
                <p className="text-sm text-muted-foreground mt-2">{loc.address}</p>
                <p className="text-sm text-muted-foreground">{loc.city}</p>
                <p className="text-sm text-muted-foreground mt-3">{loc.hours}</p>
                <p className="text-sm text-primary mt-3">{loc.phone}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground mb-6">Nos collaborateurs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {collaborators.map((person) => (
              <div key={person.email} className="bg-card rounded-2xl border border-border p-6">
                <div className="w-12 h-12 rounded-xl gamatch-accent-gradient flex items-center justify-center text-primary-foreground font-bold">
                  {person.name.slice(0, 1)}
                </div>
                <h3 className="font-display font-semibold text-foreground mt-4">{person.name}</h3>
                <p className="text-sm text-muted-foreground">{person.role}</p>
                <p className="text-sm text-muted-foreground mt-2">{person.location}</p>
                <p className="text-sm text-primary mt-2">{person.email}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
