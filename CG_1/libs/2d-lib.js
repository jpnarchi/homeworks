/*
 * Functions for 2D transformations
 *
 * Gilberto Echeverria
 * 2024-11-04
 */

class V2 {
    static create(px, py) {
        let v = new Float32Array(2);
        v[0] = px;
        v[1] = py;
        return v;
    }

    static add(va, vb) {
        let v = new Float32Array(2);
        v[0] = va[0] + vb[0];
        v[1] = va[1] + vb[1];
        return v;
    }

    static subtract(va, vb) {
        let v = new Float32Array(2);
        v[0] = va[0] - vb[0];
        v[1] = va[1] - vb[1];
        return v;
    }
}


class M3 {
    static identity() {
        let m = new Float32Array(9);
        m[0] = 1;
        m[1] = 0;
        m[2] = 0;
        m[3] = 0;
        m[4] = 1;
        m[5] = 0;
        m[6] = 0;
        m[7] = 0;
        m[8] = 1;
        return m;
    }

    static scale(vs) {
        let m = new Float32Array(9);
        m[0] = vs[0];
        m[1] = 0;
        m[2] = 0;
        m[3] = 0;
        m[4] = vs[1];
        m[5] = 0;
        m[6] = 0;
        m[7] = 0;
        m[8] = 1;
        return m;
    }

    static translation(vt) {
        let m = new Float32Array(9);
        m[0] = 1;
        m[1] = 0;
        m[2] = 0;
        m[3] = 0;
        m[4] = 1;
        m[5] = 0;
        m[6] = vt[0];
        m[7] = vt[1];
        m[8] = 1;
        return m;
    }

    static rotation(angleRadians) {
        let m = new Float32Array(9);
        const c = Math.cos(angleRadians);
        const s = Math.sin(angleRadians);
        m[0] = c;
        m[1] = s;
        m[2] = 0;
        m[3] = -s;
        m[4] = c;
        m[5] = 0;
        m[6] = 0;
        m[7] = 0;
        m[8] = 1;
        return m;
    }

/*
// Matrix guide:
// Consider the rows and columns are transposed
a00 a01 a02            b00 b01 b02
a10 a11 a12            b10 b11 b12
a20 a21 a22            b20 b21 b22
*/
    static multiply(ma, mb) {
        // Get individual elements of the matrices
        const ma00 = ma[0 * 3 + 0];
        const ma01 = ma[0 * 3 + 1];
        const ma02 = ma[0 * 3 + 2];
        const ma10 = ma[1 * 3 + 0];
        const ma11 = ma[1 * 3 + 1];
        const ma12 = ma[1 * 3 + 2];
        const ma20 = ma[2 * 3 + 0];
        const ma21 = ma[2 * 3 + 1];
        const ma22 = ma[2 * 3 + 2];

        const mb00 = mb[0 * 3 + 0];
        const mb01 = mb[0 * 3 + 1];
        const mb02 = mb[0 * 3 + 2];
        const mb10 = mb[1 * 3 + 0];
        const mb11 = mb[1 * 3 + 1];
        const mb12 = mb[1 * 3 + 2];
        const mb20 = mb[2 * 3 + 0];
        const mb21 = mb[2 * 3 + 1];
        const mb22 = mb[2 * 3 + 2];

        let m = new Float32Array(9);
        m[0] = ma00 * mb00 + ma10 * mb01 + ma20 * mb02;
        m[1] = ma01 * mb00 + ma11 * mb01 + ma21 * mb02;
        m[2] = ma02 * mb00 + ma12 * mb01 + ma22 * mb02;
        m[3] = ma00 * mb10 + ma10 * mb11 + ma20 * mb12;
        m[4] = ma01 * mb10 + ma11 * mb11 + ma21 * mb12;
        m[5] = ma02 * mb10 + ma12 * mb11 + ma22 * mb12;
        m[6] = ma00 * mb20 + ma10 * mb21 + ma20 * mb22;
        m[7] = ma01 * mb20 + ma11 * mb21 + ma21 * mb22;
        m[8] = ma02 * mb20 + ma12 * mb21 + ma22 * mb22;
        return m;
    }

}

export { V2, M3 };
