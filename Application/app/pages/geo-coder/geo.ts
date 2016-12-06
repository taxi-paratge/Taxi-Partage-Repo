/**
 * @summary Cette classe est utilisée par l'API Geo Coder qui permet de prendre une adresse et de la transformer en latitude et longitude.
 *
 * @author Equipe Whos.
 */

export class Geo{
  constructor(long,lat,maj)
  {
  	this.longitude=long;
  	this.latitude=lat;
  	this.derniere_mise_a_jour=maj;
  }
  private longitude: string;
  private latitude: string;
  private derniere_mise_a_jour: string;



}
