
public class GLSLChar {
	public static String generateLetters() {
		int[][][] cs = new int[][][]{{
			 {0,1,0},
			 {1,0,1},
			 {1,1,1},
			 {1,0,1},
			 {1,0,1}}, 
			 
			 {{1,1,0},
			  {1,0,1},
			  {1,1,1},
			  {1,0,1},
			  {1,1,0}},
			 
			 {{1,1,0},
			  {1,0,1},
			  {1,0,1},
			  {1,0,1},
			  {1,1,0}},
			 
			 {{1,1,1},
			  {1,0,0},
			  {1,1,0},
			  {1,0,0},
			  {1,1,1}},
			 
			 {{0,1,0},
			  {0,1,0},
			  {0,1,0},
			  {0,1,0},
			  {0,1,0}},
			 
			 {{1,1,0},
			  {1,0,1},
			  {1,1,0},
			  {1,0,1},
			  {1,0,1}},
			  
		
			 {{0,0,1,0,0},
			  {1,1,1,1,1},
			  {0,0,1,0,0},
			  {0,1,1,1,0},
			  {0,1,0,1,0},
			  {0,1,0,1,0}},
			  
		     {{0,0,1,0,0},
			  {1,1,1,1,1},
			  {0,0,1,0,0},
			  {0,0,1,0,0},
			  {0,0,1,0,0},
			  {0,0,1,0,0}}};
		
		String[] names = new String[]{"ALetter", "BLetter", "DLetter", "ELetter", "ILetter",  "RLetter", "Marcher", "Cross"};
		
		String size = "2.0";
		
		String res = "";
		for (int i = 0; i < names.length; i++) {
			int[][] c = cs[i];
			res += "float " + names[i] + "(vec3 p, float ps)\n";
			res += "{\n";
			res += "\tfloat res = 99999999;\n";
			for (int y = 0; y < c.length; y++) {
				for (int x = 0; x < c[y].length; x++) {
					if (c[y][c[y].length - x - 1] == 1) { // x
						res += "\tres = min(res, sdBox(p + vec3(" + x + " * ps * " + size + " , " + y + " * ps * " + size + " , 0), vec3(ps)));\n";
					}
				}
			}
			res += "\treturn res;\n";
			res +="}\n";
		}
		
		return res;
	}
}
