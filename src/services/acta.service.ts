import axiosInstance from "../utils/axios";

export const actaService = {
  async enviarActa(
    mesaId: string, 
    fotos: File[], 
    observaciones: string, 
    votos: any
  ): Promise<any> {
    // 1. Enviar votos primero (validación rápida y ligera)
    const { data: responseVotos } = await axiosInstance.post('/actas', {
      mesaId,
      observaciones,
      votos: JSON.stringify(votos)
    });

    const actaId = responseVotos.actaId;

    // 2. Enviar las fotos (proceso pesado)
    const formData = new FormData();
    fotos.forEach((foto) => {
      formData.append('fotos_actas', foto);
    });

    let fotosFallidas = false;
    try {
      await axiosInstance.post(`/actas/${actaId}/fotos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      console.error("Error subiendo fotos:", error);
      fotosFallidas = true;
    }
    
    return { ...responseVotos, fotosFallidas };
  }
};
