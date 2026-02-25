import { siteConfig } from "@/content/site";

export default function PersonSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteConfig.url}/#person`,
    name: siteConfig.name,
    givenName: "Anirudh",
    familyName: "Pottammal",
    alternateName: ["Anirudh Pottammal", "Ani Pottammal"],
    description: siteConfig.bio,
    url: siteConfig.url,
    image: `${siteConfig.url}${siteConfig.headshot}`,
    sameAs: [
      "https://twitter.com/anipottsbuilds",
      "https://github.com/anipotts",
      "https://linkedin.com/in/anipotts",
    ],
    jobTitle: siteConfig.title,
    alumniOf: {
      "@type": "EducationalOrganization",
      name: "New York University",
    },
    knowsAbout: [
      "Claude Code",
      "React",
      "TypeScript",
      "Next.js",
      "Python",
      "Software Engineering",
      "System Design",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
