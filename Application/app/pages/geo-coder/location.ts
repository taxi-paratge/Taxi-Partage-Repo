/**
 * @summary Cette classe est utilisée par l'API Geo Coder qui permet de prendre une adresse et de la transformer en latitude et longitude.
 *
 * @author Equipe Whos.
 */

import { Geo } from './geo';
import { Adresse } from './adresse';
export class Location{
  constructor(geo,adresse,order)
  {
  	this.geo=geo;
  	this.adresse =adresse;
  	this.ordre_arret=order;

  }
  private geo: Geo;
  private adresse:Adresse;
  private ordre_arret :any;//shoulf be int

}
