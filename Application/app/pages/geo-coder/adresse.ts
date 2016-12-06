/**
 * @summary Cette classe est utilisée par l'API Geo Coder qui permet de prendre une adresse et de la transformer en latitude et longitude.
 *
 * @author Equipe Whos.
 */

export class Adresse{
  constructor(civique,adresse,ville,region,formatted_address)
  {
  	this.civique=civique;
  	this.adresse = adresse;
  	this.ville=ville;
  	this.region=region;
  	this.formatted_address = formatted_address;
  }
  private civique: string;
  private adresse: string;
  private ville:string;
  private region:string;
  private formatted_address:string;
}
