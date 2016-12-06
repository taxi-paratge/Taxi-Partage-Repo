/**
 * @summary Cette classe est utilisée par l'API Geo Coder qui permet de prendre une adresse et de la transformer en latitude et longitude.
 *
 * @author Equipe Whos.
 */

import { Location } from './location';
export class Usager{
  constructor(origin,destination,name,photo,remarque,tel)
  {
  	this.origine_location=origin;
  	this.destination_location=destination;
  	this.nom_client = name;
  	this.photo_client = photo;
  	this.remarque = remarque;
  	this.tel=tel;

  }
  private origine_location: Location;
  private destination_location: Location;
  private nom_client:string;
  private photo_client:string;
  private remarque:string;
  private tel:string;
}
